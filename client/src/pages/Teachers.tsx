import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Download, Eye, Pencil, Trash2, GraduationCap, X, XCircle, FileDown, AlertTriangle, Phone, Save, Mail, BookOpen, Users, Upload, Edit, Camera, User, Calendar, Clock, Briefcase, MapPin, FileText } from 'lucide-react';
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
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { ExportButton } from '@/components/ui/export-button';
import { ExportDialog } from '@/components/ui/export-dialog';
import {
  ActionButtonsContainer,
  QuickActions,
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
  gender?: string;
  email: string;
  phone?: string;
  specialty?: string;
  bio?: string;
  dateOfBirth?: string;
  hireDate?: string;
  status: string;
  photoUrl?: string;
  address?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  notes?: string;
  educations?: string[];
  languages?: string[];
  subjects?: string[];
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null);
  
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
  
  // Query voor docenten uit de database
  const { data: teachersData = { teachers: [], totalCount: 0 }, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['/api/teachers'],
    queryFn: async () => {
      const response = await apiRequest('/api/teachers');
      return response || { teachers: [], totalCount: 0 };
    },
  });

  const teachers = teachersData.teachers || [];
  
  // Query voor vakken uit de database
  const { data: coursesData = [] } = useQuery({
    queryKey: ['/api/programs'],
    queryFn: async () => {
      const response = await apiRequest('/api/programs');
      return response || [];
    },
  });

  const courses = Array.isArray(coursesData) ? coursesData : (coursesData?.courses || []);

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
    setNewTeacher({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone || '',
      specialty: teacher.specialty || '',
      bio: teacher.bio || '',
      status: teacher.status || 'Actief',
      dateOfBirth: teacher.dateOfBirth || '',
      hireDate: teacher.hireDate || '',
      photoUrl: teacher.photoUrl || '',
      gender: teacher.gender || '',
      street: teacher.street || '',
      houseNumber: teacher.houseNumber || '',
      postalCode: teacher.postalCode || '',
      city: teacher.city || '',
      notes: teacher.notes || '',
    });
    
    // Set existing educations and languages if available
    setTeacherEducations(teacher.educations || []);
    setTeacherLanguages(teacher.languages || []);
    
    // Set existing subjects if available
    setSelectedSubjects(teacher.subjects ? teacher.subjects.map(subject => subject.id.toString()) : []);
    
    setIsEditMode(true);
    setEditingTeacherId(teacher.id);
    setShowNewTeacherDialog(true);
    setActiveTab('basic');
    setHasValidationAttempt(false);
    setShowViewDialog(false);
  };

  const handleDeleteTeacher = (teacher: TeacherType) => {
    setSelectedTeacher(teacher);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTeacher = async () => {
    if (!selectedTeacher) return;
    
    try {
      const response = await fetch(`/api/teachers/${selectedTeacher.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fout bij verwijderen docent');
      }
      
      // Invalidate en refetch de teachers data
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      
      toast({
        title: "Docent verwijderd",
        description: `${selectedTeacher.firstName} ${selectedTeacher.lastName} is succesvol verwijderd.`,
      });
      
      setShowDeleteDialog(false);
      setSelectedTeacher(null);
    } catch (error) {
      toast({
        title: "Fout bij verwijderen",
        description: error instanceof Error ? error.message : "Er is een probleem opgetreden bij het verwijderen van de docent.",
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

  // BeID authenticatie functie
  const handleBeIDAuthentication = () => {
    toast({
      title: "eID authenticatie gestart",
      description: "Plaats uw eID kaart in de lezer en volg de instructies...",
      duration: 5000,
    });
    
    // Simuleer eID authenticatie (in productie zou dit via eID API gaan)
    setTimeout(() => {
      const eidData = {
        firstName: "Mohammed",
        lastName: "El Hassan",
        gender: "Man",
        dateOfBirth: "1985-03-12",
        email: "mohammed.elhassan@school.be",
        phone: "0496123456",
        photoUrl: "https://placehold.co/400x400/eee/31316a?text=Foto+eID",
        street: "Schoolstraat",
        houseNumber: "25",
        postalCode: "2000",
        city: "Antwerpen"
      };
      
      setNewTeacher(prev => ({
        ...prev,
        ...eidData
      }));
      
      toast({
        title: "eID gegevens geladen",
        description: "De docentgegevens inclusief foto zijn succesvol uitgelezen van de eID kaart.",
      });
    }, 2000);
  };

  // itsme authenticatie functie
  const handleItsmeAuthentication = () => {
    toast({
      title: "itsme authenticatie gestart",
      description: "Open de itsme app op uw smartphone en bevestig uw identiteit...",
      duration: 5000,
    });
    
    // Simuleer itsme authenticatie (in productie zou dit via itsme API gaan)
    setTimeout(() => {
      const itsmeData = {
        firstName: "Yasmine",
        lastName: "Alami",
        gender: "Vrouw",
        dateOfBirth: "1988-07-19",
        email: "yasmine.alami@school.be",
        phone: "0497654321",
        photoUrl: "https://placehold.co/400x400/eee/7c3aed?text=Foto+itsme",
        street: "Mechelsesteenweg",
        houseNumber: "187",
        postalCode: "2018",
        city: "Antwerpen"
      };
      
      setNewTeacher(prev => ({
        ...prev,
        ...itsmeData
      }));
      
      toast({
        title: "itsme gegevens geladen",
        description: "De docentgegevens inclusief foto zijn succesvol opgehaald via itsme.",
      });
    }, 2000);
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

  // Genereer een uniek, oplopend docent ID
  const generateTeacherId = () => {
    if (teachers.length === 0) return 'DC001';
    
    // Haal alle bestaande docent ID's op en sorteer ze
    const existingIds = teachers
      .map(teacher => teacher.teacherId)
      .filter(id => id && id.startsWith('DC'))
      .map(id => parseInt(id.substring(2)))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);
    
    // Zoek het volgende beschikbare nummer
    let nextNumber = 1;
    for (const num of existingIds) {
      if (num === nextNumber) {
        nextNumber++;
      } else {
        break;
      }
    }
    
    return `DC${nextNumber.toString().padStart(3, '0')}`;
  };

  // Reset formulier functie
  const resetTeacherForm = () => {
    setNewTeacher({
      firstName: '',
      lastName: '',
      gender: '',
      email: '',
      phone: '',
      specialty: '',
      bio: '',
      status: 'active',
      dateOfBirth: '',
      hireDate: new Date().toISOString().split('T')[0],
      street: '',
      houseNumber: '',
      postalCode: '',
      city: '',
    });
    setTeacherEducations([]);
    setTeacherLanguages([]);
    setNewEducation('');
    setNewLanguage('');
    setSelectedSubjects([]);
    setHasValidationAttempt(false);
    setActiveTab('basic');
  };

  // Mutation voor het toevoegen van docenten
  const createTeacherMutation = useMutation({
    mutationFn: async (teacherData: any) => {
      return await apiRequest('/api/teachers', {
        method: 'POST',
        body: JSON.stringify(teacherData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      toast({
        title: "Docent toegevoegd",
        description: "De nieuwe docent is succesvol toegevoegd.",
      });
      resetTeacherForm();
      setShowNewTeacherDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een probleem opgetreden bij het toevoegen van de docent.",
        variant: "destructive",
      });
    },
  });

  // Opslaan van nieuwe docent
  const handleSaveTeacher = async () => {
    setHasValidationAttempt(true);
    
    if (!validateNewTeacher()) return;
    
    if (isEditMode && editingTeacherId) {
      // Update existing teacher
      try {
        const teacherData = {
          ...newTeacher,
          educations: teacherEducations,
          languages: teacherLanguages,
          subjects: selectedSubjects
        };

        const response = await fetch(`/api/teachers/${editingTeacherId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(teacherData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Fout bij bijwerken docent');
        }

        // Invalidate en refetch de teachers data
        queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });

        toast({
          title: "Docent bijgewerkt",
          description: "De docentgegevens zijn succesvol bijgewerkt.",
        });

        resetTeacherForm();
        setShowNewTeacherDialog(false);
        setIsEditMode(false);
        setEditingTeacherId(null);
      } catch (error) {
        toast({
          title: "Fout bij bijwerken",
          description: error instanceof Error ? error.message : "Er is een probleem opgetreden bij het bijwerken van de docent.",
          variant: "destructive",
        });
      }
    } else {
      // Create new teacher
      const teacherData = {
        ...newTeacher,
        teacherId: generateTeacherId(),
        educations: teacherEducations,
        languages: teacherLanguages,
        subjects: selectedSubjects.map(id => parseInt(id)),
      };
      
      createTeacherMutation.mutate(teacherData);
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
                  <ExportButton
                    onClick={() => setIsExportDialogOpen(true)}
                    title="Exporteer docenten"
                  />
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
                {searchResults.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <EmptyState
                        icon={<GraduationCap className="h-8 w-8 text-gray-400" />}
                        title="Geen docenten gevonden"
                        description={searchQuery ? "Er zijn geen docenten die overeenkomen met je zoekopdracht." : "Er zijn nog geen docenten toegevoegd."}
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
                        <span className="text-xs text-gray-600">
                          {teacher.subjects && teacher.subjects.length > 0 
                            ? teacher.subjects.map((subject: any) => 
                                typeof subject === 'string' ? subject : subject.name || subject.code
                              ).join(', ')
                            : 'Geen vakken toegewezen'
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={`px-2 py-1 text-xs font-normal ${getStatusColor(teacher.status)}`}>
                          {getStatusLabel(teacher.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <QuickActions
                          onView={() => handleViewTeacher(teacher)}
                          onEdit={() => handleEditTeacher(teacher)}
                          onDelete={() => handleDeleteTeacher(teacher)}
                        />
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
                    setSelectedTeacher(selectedTeacher);
                    setNewTeacher({
                      firstName: selectedTeacher.firstName,
                      lastName: selectedTeacher.lastName,
                      email: selectedTeacher.email,
                      phone: selectedTeacher.phone || '',
                      specialty: selectedTeacher.specialty || '',
                      bio: selectedTeacher.bio || '',
                      status: selectedTeacher.status || 'active',
                      dateOfBirth: selectedTeacher.dateOfBirth || '',
                      hireDate: selectedTeacher.hireDate || '',
                      photoUrl: selectedTeacher.photoUrl || '',
                      gender: selectedTeacher.gender || '',
                      street: selectedTeacher.street || '',
                      houseNumber: selectedTeacher.houseNumber || '',
                      postalCode: selectedTeacher.postalCode || '',
                      city: selectedTeacher.city || '',
                      notes: selectedTeacher.notes || '',
                    });
                    setTeacherEducations(selectedTeacher.educations || []);
                    setTeacherLanguages(selectedTeacher.languages || []);
                    setSelectedSubjects(selectedTeacher.subjects ? selectedTeacher.subjects.map((subject: any) => subject.id?.toString() || subject) : []);
                    setIsEditMode(true);
                    setEditingTeacherId(selectedTeacher.id);
                    setShowEditTeacherDialog(true);
                    setActiveTab('basic');
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
                        onClick={handleBeIDAuthentication}
                      >
                        <img src="/images/beid-logo.png" alt="eID" className="h-5" />
                        <span className="text-xs font-medium text-gray-700">eID</span>
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
                    {courses.length > 0 ? courses.map((course: any) => (
                      <div key={course.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-subject-${course.id}`}
                          checked={selectedSubjects.includes(course.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSubjects(prev => [...prev, course.name]);
                            } else {
                              setSelectedSubjects(prev => prev.filter(s => s !== course.name));
                            }
                          }}
                        />
                        <Label htmlFor={`edit-subject-${course.id}`} className="text-sm">
                          {course.name}
                        </Label>
                      </div>
                    )) : (
                      <div className="col-span-full text-center py-4 text-gray-500">
                        <p className="text-sm">Geen vakken beschikbaar. Voeg eerst vakken toe via de Vakken sectie.</p>
                      </div>
                    )}
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
              onClick={async () => {
                if (!selectedTeacher || !editingTeacherId) return;

                try {
                  const teacherData = {
                    ...newTeacher,
                    educations: teacherEducations,
                    languages: teacherLanguages,
                    subjects: selectedSubjects
                  };

                  const response = await fetch(`/api/teachers/${editingTeacherId}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(teacherData),
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Fout bij bijwerken docent');
                  }

                  // Invalidate en refetch de teachers data
                  queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });

                  toast({
                    title: "Docent bijgewerkt",
                    description: "De docentgegevens zijn succesvol bijgewerkt.",
                  });

                  setShowEditTeacherDialog(false);
                  setSelectedTeacher(null);
                  setIsEditMode(false);
                  setEditingTeacherId(null);
                } catch (error) {
                  toast({
                    title: "Fout bij bijwerken",
                    description: error instanceof Error ? error.message : "Er is een probleem opgetreden bij het bijwerken van de docent.",
                    variant: "destructive",
                  });
                }
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

      {/* Delete Teacher Dialog */}
      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Docent Verwijderen"
        description="Weet je zeker dat je deze docent wilt verwijderen?"
        onConfirm={confirmDeleteTeacher}
        item={selectedTeacher ? {
          name: `${selectedTeacher.firstName} ${selectedTeacher.lastName}`,
          id: `Docent ID: ${selectedTeacher.teacherId}`,
          photoUrl: selectedTeacher.photoUrl,
          initials: `${selectedTeacher.firstName?.charAt(0)}${selectedTeacher.lastName?.charAt(0)}`
        } : undefined}
        warningText="Deze actie kan niet ongedaan worden gemaakt. De docent wordt permanent verwijderd uit het systeem."
      />

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
                {/* Header met foto en basisgegevens */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                      <div className="flex-shrink-0 text-center">
                        <Avatar className="h-24 w-24 mx-auto border-4 border-white shadow-lg">
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
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                              {selectedTeacher.firstName} {selectedTeacher.lastName}
                            </h1>
                            <p className="text-sm text-gray-500 font-medium">{selectedTeacher.teacherId}</p>
                          </div>
                          <div className="mt-2 sm:mt-0">
                            <Badge className={`px-3 py-1 text-xs font-medium ${getStatusColor(selectedTeacher.status)}`}>
                              {getStatusLabel(selectedTeacher.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Persoonlijke Informatie */}
                <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                  <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Persoonlijke Informatie
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Mail className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Email</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 break-all">{selectedTeacher.email}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Phone className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Telefoon</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{selectedTeacher.phone || 'Niet opgegeven'}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Geboortedatum</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{selectedTeacher.dateOfBirth || 'Niet opgegeven'}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Users className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Geslacht</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{selectedTeacher.gender || 'Niet opgegeven'}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">In dienst sinds</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{selectedTeacher.hireDate || 'Niet opgegeven'}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <Briefcase className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Status</span>
                      </div>
                      <Badge className={`inline-flex px-3 py-1 text-xs font-medium ${getStatusColor(selectedTeacher.status)}`}>
                        {getStatusLabel(selectedTeacher.status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Professionele Informatie */}
                <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                  <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Professionele Informatie
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <BookOpen className="h-4 w-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">Beroep/Specialisatie</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">{selectedTeacher.specialty || 'Niet gespecificeerd'}</p>
                    </div>
                    
                    {selectedTeacher.bio && (
                      <div className="space-y-1 md:col-span-2">
                        <div className="flex items-center space-x-2 text-gray-500">
                          <FileText className="h-4 w-4" />
                          <span className="text-xs font-medium uppercase tracking-wide">Bio</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{selectedTeacher.bio}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Adresgegevens */}
                <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                  <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Adresgegevens
                  </h3>
                  {selectedTeacher.street || selectedTeacher.city ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-gray-500">
                          <MapPin className="h-4 w-4" />
                          <span className="text-xs font-medium uppercase tracking-wide">Adres</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedTeacher.street && selectedTeacher.houseNumber 
                            ? `${selectedTeacher.street} ${selectedTeacher.houseNumber}`
                            : selectedTeacher.street || 'Niet opgegeven'
                          }
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-gray-500">
                          <MapPin className="h-4 w-4" />
                          <span className="text-xs font-medium uppercase tracking-wide">Postcode & Plaats</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedTeacher.postalCode && selectedTeacher.city 
                            ? `${selectedTeacher.postalCode} ${selectedTeacher.city}`
                            : selectedTeacher.city || 'Niet opgegeven'
                          }
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Geen adresgegevens beschikbaar</p>
                  )}
                </div>

                {/* Opleidingen */}
                {selectedTeacher.educations && selectedTeacher.educations.length > 0 && (
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Opleidingen
                    </h3>
                    <div className="space-y-2">
                      {selectedTeacher.educations.map((education, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          <p className="text-sm font-medium text-gray-900">{education}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Talen */}
                {selectedTeacher.languages && selectedTeacher.languages.length > 0 && (
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Gesproken Talen
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedTeacher.languages.map((language, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vakken */}
                {selectedTeacher.subjects && selectedTeacher.subjects.length > 0 && (
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Lesgegeven Vakken
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedTeacher.subjects.map((subjectId, index) => {
                        const subject = courses.find((c: any) => c.id.toString() === subjectId);
                        return (
                          <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded border">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {subject ? `${subject.name} (${subject.code})` : subjectId}
                            </span>
                          </div>
                        );
                      })}
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
        <DialogContent className="sm:max-w-[85vw] p-0 min-h-[600px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeaderWithIcon
            icon={<GraduationCap className="h-5 w-5" />}
            title={isEditMode ? "Docent bewerken" : "Nieuwe docent toevoegen"}
            description={isEditMode ? "Pas de docentgegevens aan." : "Vul de gegevens in om een nieuwe docent toe te voegen."}
          />
          
          {/* Tabs met formulier secties */}
          <DialogFormContainer className="flex-1 overflow-y-auto">
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
                <SectionContainer title="Persoonlijke informatie" icon={<User className="h-4 w-4" />}>
                  {/* Foto en verificatie sectie */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
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
                          onClick={handleBeIDAuthentication}
                        >
                          <img src="/images/beid-logo.png" alt="eID" className="h-5" />
                          <span className="text-xs font-medium text-gray-700">eID</span>
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
                        <SelectTrigger className="mt-1 h-9 w-full border-[#e5e7eb] bg-white">
                          <SelectValue placeholder="Selecteer geslacht" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#e5e7eb]">
                          <SelectItem value="Man" className="focus:bg-blue-200 hover:bg-blue-100">Man</SelectItem>
                          <SelectItem value="Vrouw" className="focus:bg-blue-200 hover:bg-blue-100">Vrouw</SelectItem>
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
                        <SelectTrigger className="mt-1 h-9 w-full border-[#e5e7eb] bg-white">
                          <SelectValue placeholder="Selecteer status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#e5e7eb]">
                          <SelectItem value="active" className="focus:bg-blue-200 hover:bg-blue-100">Actief</SelectItem>
                          <SelectItem value="inactive" className="focus:bg-blue-200 hover:bg-blue-100">Niet actief</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                </SectionContainer>

                <SectionContainer title="Adresgegevens" icon={<MapPin className="h-4 w-4" />}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-1">
                      <Label htmlFor="street" className="text-xs text-gray-700">
                        Straat
                      </Label>
                      <Input
                        id="street"
                        value={newTeacher.street || ''}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, street: e.target.value }))}
                        className="mt-1"
                        placeholder="Bijv. Kerkstraat"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label htmlFor="houseNumber" className="text-xs text-gray-700">
                        Huisnummer
                      </Label>
                      <Input
                        id="houseNumber"
                        value={newTeacher.houseNumber || ''}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, houseNumber: e.target.value }))}
                        className="mt-1"
                        placeholder="Bijv. 123A"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label htmlFor="postalCode" className="text-xs text-gray-700">
                        Postcode
                      </Label>
                      <Input
                        id="postalCode"
                        value={newTeacher.postalCode || ''}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, postalCode: e.target.value }))}
                        className="mt-1"
                        placeholder="Bijv. 2000"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <Label htmlFor="city" className="text-xs text-gray-700">
                        Stad
                      </Label>
                      <Input
                        id="city"
                        value={newTeacher.city || ''}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, city: e.target.value }))}
                        className="mt-1"
                        placeholder="Bijv. Antwerpen"
                      />
                    </div>
                  </div>
                </SectionContainer>

              </TabsContent>
              
              <TabsContent value="details" className="space-y-6">
                <SectionContainer title="Aanvullende informatie" icon={<FileText className="h-4 w-4" />}>
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
                    <div>
                      <Label htmlFor="bio" className="text-xs text-gray-700">
                        Biografie
                      </Label>
                      <textarea
                        id="bio"
                        value={newTeacher.bio || ''}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, bio: e.target.value }))}
                        className="mt-1 w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Vertel iets over jezelf..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes" className="text-xs text-gray-700">
                        Notities
                      </Label>
                      <textarea
                        id="notes"
                        value={newTeacher.notes || ''}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, notes: e.target.value }))}
                        className="mt-1 w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Aanvullende notities..."
                      />
                    </div>
                  </div>
                </SectionContainer>

                <SectionContainer title="Opleidingen" icon={<GraduationCap className="h-4 w-4" />}>
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

                <SectionContainer title="Talen" icon={<Users className="h-4 w-4" />}>
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
                <SectionContainer title="Vakken toewijzen" icon={<BookOpen className="h-4 w-4" />}>
                  <div className="space-y-4 w-full">
                    <p className="text-sm text-gray-600">
                      Selecteer de vakken die deze docent kan onderwijzen.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {courses.length > 0 ? courses.map((course: any) => (
                        <div key={course.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`subject-${course.id}`}
                            checked={selectedSubjects.includes(course.id.toString())}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSubjects(prev => [...prev, course.id.toString()]);
                              } else {
                                setSelectedSubjects(prev => prev.filter(id => id !== course.id.toString()));
                              }
                            }}
                          />
                          <Label htmlFor={`subject-${course.id}`} className="text-sm">
                            {course.name} ({course.code})
                          </Label>
                        </div>
                      )) : (
                        <div className="col-span-full text-center py-4 text-gray-500">
                          <p className="text-sm">Geen vakken beschikbaar. Voeg eerst vakken toe via de Vakken sectie.</p>
                        </div>
                      )}
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

      {/* Export dialoog */}
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        title="Docenten Exporteren"
        description="Kies een formaat om de docenten te exporteren"
        selectedCount={selectedTeachers.length}
        totalCount={teachers.length}
        entityName="docenten"
        onExport={handleExportTeachers}
      />
    </div>
  );
}