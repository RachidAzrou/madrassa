import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Download, Eye, Pencil, Trash2, Users, UserCheck, X, UserCircle, Mail, Home, BookOpen, Phone, XCircle, AlertTriangle, FileDown, FileSpreadsheet, GraduationCap, ExternalLink, UserX, User, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

// Type definities
type GuardianType = {
  id: number;
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  phone?: string;
  address?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  isEmergencyContact: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  notes?: string;

};

type StudentType = {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  status?: string;
  email?: string;
  phone?: string;
};

type GuardianStudentRelationType = {
  id: number;
  guardianId: number;
  studentId: number;
  isPrimary: boolean;
  student?: StudentType;
};

export default function Guardians() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianType | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentType | null>(null);
  
  const initialNewGuardian = {
    firstName: '',
    lastName: '',
    relationship: 'parent',
    email: '',
    phone: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    occupation: '',
    isEmergencyContact: false,
    notes: ''
  };
  
  const [newGuardian, setNewGuardian] = useState<any>(initialNewGuardian);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [primaryStudentId, setPrimaryStudentId] = useState<number | null>(null);
  const [filteredStudentIds, setFilteredStudentIds] = useState<number[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Queries en Mutations
  const { data: guardiansData = [] } = useQuery({ 
    queryKey: ['/api/guardians'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const { data: studentsData = [] } = useQuery({ 
    queryKey: ['/api/students'], 
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Query voor alle voogd-student relaties (voor weergave in tabel)
  const guardianStudentsQuery = useQuery({
    queryKey: ['/api/student-guardians'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Query voor relaties van de geselecteerde voogd (voor detailweergave)
  const { data: guardianStudentsData = [], isLoading: guardianStudentsLoading } = useQuery({
    queryKey: ['/api/guardians', selectedGuardian?.id, 'students'],
    enabled: !!selectedGuardian?.id,
  });
  
  const createGuardianMutation = useMutation({
    mutationFn: (guardian: any) => 
      apiRequest(`/api/guardians`, {
        method: 'POST',
        body: JSON.stringify(guardian)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      toast({
        title: "Voogd toegevoegd",
        description: "De voogd is succesvol toegevoegd.",
      });
      setShowAddDialog(false);
      setNewGuardian(initialNewGuardian);
      setSelectedStudentIds([]);
      setPrimaryStudentId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de voogd: " + (error.message || error),
        variant: "destructive",
      });
    }
  });
  
  const updateGuardianMutation = useMutation({
    mutationFn: (guardian: any) => 
      apiRequest(`/api/guardians/${guardian.id}`, {
        method: 'PATCH',
        body: JSON.stringify(guardian)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      toast({
        title: "Voogd bijgewerkt",
        description: "De voogd is succesvol bijgewerkt.",
      });
      setShowAddDialog(false);
      setSelectedGuardian(null);
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de voogd: " + (error.message || error),
        variant: "destructive",
      });
    }
  });

  const addGuardianStudentRelationMutation = useMutation({
    mutationFn: (data: { guardianId: number, studentId: number, isPrimary: boolean }) => 
      apiRequest(`/api/guardians/${data.guardianId}/students`, {
        method: 'POST',
        body: JSON.stringify({ 
          studentId: data.studentId,
          isPrimary: data.isPrimary
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het koppelen van de student: " + (error.message || error),
        variant: "destructive",
      });
    }
  });
  
  // Filter guardians based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults(guardiansData);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = guardiansData.filter((guardian: any) => {
      return (
        guardian.firstName.toLowerCase().includes(query) ||
        guardian.lastName.toLowerCase().includes(query) ||
        guardian.email.toLowerCase().includes(query) ||
        (guardian.phone && guardian.phone.includes(query))
      );
    });
    
    setSearchResults(filtered);
  }, [searchQuery, guardiansData]);
  
  // Students that can be added to a guardian
  useEffect(() => {
    if (studentSearchQuery.trim() === '') {
      setFilteredStudentIds(
        studentsData
          .filter((student: any) => !selectedStudentIds.includes(student.id))
          .map((student: any) => student.id)
      );
      return;
    }
    
    const query = studentSearchQuery.toLowerCase();
    const filtered = studentsData.filter((student: any) => {
      return (
        !selectedStudentIds.includes(student.id) &&
        (student.firstName.toLowerCase().includes(query) ||
         student.lastName.toLowerCase().includes(query) ||
         student.studentId.toLowerCase().includes(query))
      );
    });
    
    setFilteredStudentIds(filtered.map((student: any) => student.id));
  }, [studentSearchQuery, studentsData, selectedStudentIds]);
  
  // Event Handlers
  const handleShowGuardianDetails = (guardian: any) => {
    setSelectedGuardian(guardian);
  };
  
  const handleAddNewGuardian = () => {
    setNewGuardian(initialNewGuardian);
    setSelectedStudentIds([]);
    setPrimaryStudentId(null);
    setShowAddDialog(true);
  };
  
  const handleEditGuardian = (guardian: any) => {
    setNewGuardian({
      ...guardian
    });
    setShowAddDialog(true);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewGuardian(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNewGuardian(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSubmitGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    
    const guardianData = { ...newGuardian };
    
    if (guardianData.id) {
      // Update
      updateGuardianMutation.mutate(guardianData);
    } else {
      // Create
      createGuardianMutation.mutate(guardianData);
      
      // After creating, add student relations
      createGuardianMutation.isSuccess && guardianData.id && selectedStudentIds.forEach(studentId => {
        addGuardianStudentRelationMutation.mutate({
          guardianId: guardianData.id,
          studentId,
          isPrimary: primaryStudentId === studentId
        });
      });
    }
  };
  
  // Utility for relationship display
  const getRelationshipLabel = (relationship: string) => {
    const labels: { [key: string]: string } = {
      'parent': 'Ouder',
      'guardian': 'Voogd',
      'family': 'Familie',
      'noodcontact': 'Noodcontact',
      'other': 'Anders'
    };
    
    return labels[relationship] || relationship;
  };
  
  // State variables voor filtering en selectie
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [selectedRelationshipFilter, setSelectedRelationshipFilter] = useState('all');
  const [selectedEmergencyFilter, setSelectedEmergencyFilter] = useState('all');
  const [selectedGuardians, setSelectedGuardians] = useState<number[]>([]);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Helper functions voor selectie
  const handleToggleAllGuardians = (checked: boolean) => {
    if (checked) {
      // Select all guardians from current search results
      const ids = searchResults.map((guardian: GuardianType) => guardian.id);
      setSelectedGuardians(ids);
    } else {
      // Deselect all
      setSelectedGuardians([]);
    }
  };
  
  const toggleGuardianSelection = (guardianId: number) => {
    setSelectedGuardians(prev => {
      if (prev.includes(guardianId)) {
        return prev.filter(id => id !== guardianId);
      } else {
        return [...prev, guardianId];
      }
    });
  };
  
  // Handle delete selected guardians
  const handleDeleteSelected = () => {
    if (selectedGuardians.length > 0) {
      if (window.confirm(`Weet u zeker dat u ${selectedGuardians.length} voogden wilt verwijderen?`)) {
        // Hier zou een batch delete functie komen
        toast({
          title: "Functie nog niet beschikbaar",
          description: "Het verwijderen van meerdere voogden is momenteel niet geïmplementeerd.",
          variant: "destructive"
        });
        setSelectedGuardians([]);
      }
    }
  };
  
  // Handle delete single guardian
  const handleDelete = (guardian: GuardianType) => {
    setSelectedGuardian(guardian);
    setIsDeleteDialogOpen(true);
  };
  
  const handleShowStudentDetails = (student: StudentType) => {
    setSelectedStudent(student);
  };
  
  const confirmDelete = () => {
    if (selectedGuardian) {
      toast({
        title: "Voogd verwijderd",
        description: `${selectedGuardian.firstName} ${selectedGuardian.lastName} is succesvol verwijderd.`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedGuardian(null);
    }
  };
  
  // Render
  return (
    <div className="container px-4 md:px-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col md:flex-row md:items-center border-b border-gray-200 pb-4 w-full">
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <div className="p-3 rounded-md bg-[#1e3a8a] text-white">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Voogden</h1>
              <p className="text-base text-gray-500 mt-1">Bekijk en beheer alle voogdgegevens</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Zoekbalk */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Zoek voogden..."
            className="pl-8 bg-white w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="shrink-0"
              onClick={() => setShowFilterOptions(!showFilterOptions)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            
            <div className="relative">
              <Button 
                variant="outline" 
                className="shrink-0"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              >
                <Download className="mr-2 h-4 w-4" />
                Exporteren
              </Button>
              
              {isExportMenuOpen && (
                <div 
                  id="export-menu"
                  className="absolute right-0 top-full mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden z-10 border"
                >
                  <div className="p-2">
                    <button
                      onClick={() => {
                        // Export als PDF
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md flex items-center"
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Exporteren als PDF
                    </button>
                    <button
                      onClick={() => {
                        // Export als Excel
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-md flex items-center"
                    >
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Exporteren als Excel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            onClick={handleAddNewGuardian} 
            className="bg-primary hover:bg-primary/90 text-white gap-2 ml-auto"
          >
            <PlusCircle className="h-4 w-4" />
            Nieuwe Voogd
          </Button>
        </div>
      
      {/* Filter opties */}
      {showFilterOptions && (
        <div className="mt-4 p-4 bg-gray-50 border rounded-lg">
          <h3 className="text-sm font-medium mb-3">Filter voogden</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="relationshipFilter" className="text-xs">Relatie</Label>
              <Select
                value={selectedRelationshipFilter}
                onValueChange={setSelectedRelationshipFilter}
              >
                <SelectTrigger id="relationshipFilter" className="mt-1">
                  <SelectValue placeholder="Selecteer relatie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle relaties</SelectItem>
                  <SelectItem value="parent">Ouder</SelectItem>
                  <SelectItem value="guardian">Voogd</SelectItem>
                  <SelectItem value="family">Familie</SelectItem>
                  <SelectItem value="noodcontact">Noodcontact</SelectItem>
                  <SelectItem value="other">Anders</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="emergencyFilter" className="text-xs">Noodcontact</Label>
              <Select
                value={selectedEmergencyFilter}
                onValueChange={setSelectedEmergencyFilter}
              >
                <SelectTrigger id="emergencyFilter" className="mt-1">
                  <SelectValue placeholder="Selecteer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle voogden</SelectItem>
                  <SelectItem value="yes">Alleen noodcontacten</SelectItem>
                  <SelectItem value="no">Geen noodcontacten</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedRelationshipFilter('all');
                setSelectedEmergencyFilter('all');
              }}
              className="mr-2"
            >
              Reset filters
            </Button>
          </div>
        </div>
      )}
      
      <div className="py-6">
        {searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center border rounded-lg bg-gray-50">
            <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
              <UserCheck className="h-10 w-10 text-primary opacity-30" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen voogden gevonden</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {searchQuery.trim() !== '' 
                ? 'Geen voogden gevonden die overeenkomen met je zoekopdracht. Probeer een andere zoekterm.' 
                : 'Er zijn nog geen voogden toegevoegd in het systeem. Klik op de knop "Nieuwe Voogd" om een voogd toe te voegen.'}
            </p>
            {searchQuery && (
              <Button 
                variant="outline"
                className="gap-2" 
                onClick={() => setSearchQuery('')}
              >
                <XCircle className="h-4 w-4" />
                Wis Zoekopdracht
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-b border-gray-200">
                  <TableHead className="w-[40px] py-3">
                    <Checkbox 
                      checked={selectedGuardians.length > 0 && selectedGuardians.length === searchResults.length}
                      onCheckedChange={handleToggleAllGuardians}
                    />
                  </TableHead>
                  <TableHead className="py-3 font-medium">Naam</TableHead>
                  <TableHead className="py-3 font-medium">Relatie</TableHead>
                  <TableHead className="py-3 font-medium">Studenten</TableHead>
                  <TableHead className="text-right w-[120px] py-3 font-medium">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((guardian: GuardianType) => (
                  <TableRow 
                    key={guardian.id} 
                    className="group hover:bg-gray-50 border-b border-gray-200"
                  >
                    <TableCell className="py-3">
                      <Checkbox
                        checked={selectedGuardians.includes(guardian.id)}
                        onCheckedChange={() => toggleGuardianSelection(guardian.id)}
                      />
                    </TableCell>
                    <TableCell className="py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-white text-xs">
                            {guardian.firstName.charAt(0)}{guardian.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{guardian.firstName} {guardian.lastName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center">
                        <Badge variant="outline" className={`${guardian.isEmergencyContact ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                          {getRelationshipLabel(guardian.relationship)}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell className="py-3">
                      {guardianStudentsQuery.data && guardianStudentsQuery.data.some((rel: any) => rel.guardianId === guardian.id) ? (
                        <div className="flex -space-x-2 overflow-hidden">
                          {guardianStudentsQuery.data
                            .filter((rel: any) => rel.guardianId === guardian.id)
                            .slice(0, 3)
                            .map((rel: any) => {
                              const student = studentsData.find((s: any) => s.id === rel.studentId);
                              return student ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Avatar 
                                        key={rel.id} 
                                        className="h-7 w-7 border-2 border-white cursor-pointer hover:scale-110 hover:z-10 transition-transform"
                                        onClick={() => handleShowStudentDetails(student)}
                                      >
                                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                          {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      {student.firstName} {student.lastName}
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : null;
                            })}
                          {guardianStudentsQuery.data.filter((rel: any) => rel.guardianId === guardian.id).length > 3 && (
                            <div 
                              className="flex items-center justify-center h-7 w-7 rounded-full bg-gray-100 border-2 border-white text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors"
                              onClick={() => handleShowGuardianDetails(guardian)}
                            >
                              +{guardianStudentsQuery.data.filter((rel: any) => rel.guardianId === guardian.id).length - 3}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Geen studenten</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right py-3">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => handleShowGuardianDetails(guardian)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                          onClick={() => handleEditGuardian(guardian)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={() => handleDelete(guardian)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Actieknoppen voor geselecteerde voogden */}
            {selectedGuardians.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-t flex items-center justify-between">
                <span className="text-sm">
                  {selectedGuardians.length} {selectedGuardians.length === 1 ? 'voogd' : 'voogden'} geselecteerd
                </span>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Verwijderen
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Voogd details dialoog */}
      <Dialog open={!!selectedGuardian} onOpenChange={() => setSelectedGuardian(null)}>
        <DialogContent className="sm:max-w-[900px] h-[calc(100vh-100px)] max-h-[900px] overflow-hidden p-0 bg-white rounded-lg border shadow-lg">
          <div className="flex flex-col h-full">
            {/* Header met blauwe achtergrond */}
            <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-4 -mx-6 -mt-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <UserCheck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-xl font-bold text-white">
                        {selectedGuardian?.firstName} {selectedGuardian?.lastName}
                      </DialogTitle>
                      {selectedGuardian?.isEmergencyContact && (
                        <Badge className="bg-red-500/80 hover:bg-red-500/90 text-white border-transparent text-xs">Noodcontact</Badge>
                      )}
                    </div>
                    <DialogDescription className="text-blue-100 text-sm mt-1">
                      {selectedGuardian && getRelationshipLabel(selectedGuardian.relationship)}
                    </DialogDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 text-white hover:bg-white/30 border-transparent"
                    onClick={() => {
                      handleEditGuardian(selectedGuardian!);
                      setSelectedGuardian(null);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Bewerken
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="bg-red-500/80 text-white hover:bg-red-500/90 border-transparent"
                    onClick={() => {
                      setIsDeleteDialogOpen(true);
                      setSelectedGuardian(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Verwijderen
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {selectedGuardian && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="h-6 w-6 rounded-full bg-[#1e3a8a]/10 flex items-center justify-center mr-2">
                        <Mail className="h-3.5 w-3.5 text-[#1e3a8a]" />
                      </div>
                      <h3 className="text-base font-medium text-gray-900">Contactgegevens</h3>
                    </div>
                    
                    <div className="bg-gray-50 border rounded-md p-4 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{selectedGuardian.email}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{selectedGuardian.phone || "Geen telefoonnummer"}</span>
                      </div>
                      
                      <div className="flex items-start gap-2 text-sm">
                        <Home className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          {selectedGuardian.street && selectedGuardian.houseNumber && (
                            <div>{selectedGuardian.street} {selectedGuardian.houseNumber}</div>
                          )}
                          {selectedGuardian.postalCode && selectedGuardian.city && (
                            <div>{selectedGuardian.postalCode} {selectedGuardian.city}</div>
                          )}
                          {(!selectedGuardian.street && !selectedGuardian.city) && (
                            <span className="text-gray-400">Geen adres opgegeven</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {selectedGuardian.notes && (
                      <div className="mt-6">
                        <h3 className="text-sm font-medium mb-2 text-gray-500">Notities</h3>
                        <div className="border rounded-md p-3 bg-gray-50 text-sm whitespace-pre-line">
                          {selectedGuardian.notes}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="h-6 w-6 rounded-full bg-[#1e3a8a]/10 flex items-center justify-center mr-2">
                        <Users className="h-3.5 w-3.5 text-[#1e3a8a]" />
                      </div>
                      <h3 className="text-base font-medium text-gray-900">Gekoppelde studenten</h3>
                    </div>
                    
                    {guardianStudentsLoading ? (
                      <div className="flex justify-center items-center h-32 bg-gray-50 border rounded-md">
                        <div className="w-6 h-6 border-2 border-t-primary rounded-full animate-spin"></div>
                      </div>
                    ) : guardianStudentsData.length > 0 ? (
                      <div className="bg-gray-50 border rounded-md shadow-sm overflow-hidden">
                        <div className="grid grid-cols-1 divide-y">
                          {guardianStudentsData.map((rel: GuardianStudentRelationType) => (
                            <div key={rel.id} className="p-3 hover:bg-blue-50/50 transition-colors">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{rel.student?.firstName} {rel.student?.lastName}</p>
                                  <p className="text-xs text-gray-500 mt-1">ID: {rel.student?.studentId}</p>
                                </div>
                                {rel.isPrimary && (
                                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 text-xs">Primair</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 border rounded-md shadow-sm">
                        <p className="text-gray-500 text-sm">Geen studenten gekoppeld aan deze voogd</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="flex-shrink-0 px-6 py-4 border-t bg-gray-50">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedGuardian(null)}
                  className="mr-2"
                >
                  Sluiten
                </Button>
                <Button
                  className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
                  onClick={() => {
                    setSelectedGuardian(null);
                  }}
                >
                  Opslaan
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Student details dialoog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="sm:max-w-[900px] h-[calc(100vh-100px)] max-h-[900px] overflow-hidden p-0 bg-white rounded-lg border shadow-lg">
          <div className="flex flex-col h-full">
            {/* Header met blauwe achtergrond */}
            <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-4 -mx-6 -mt-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <UserCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold text-white">
                      {selectedStudent?.firstName} {selectedStudent?.lastName}
                    </DialogTitle>
                    <DialogDescription className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                      <span>{selectedStudent?.studentId}</span>
                      <Badge className="bg-white/20 text-white border-transparent hover:bg-white/30">
                        {selectedStudent?.status === 'enrolled' ? 'Ingeschreven' : (selectedStudent?.status || 'Actief')}
                      </Badge>
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="h-6 w-6 rounded-full bg-[#1e3a8a]/10 flex items-center justify-center mr-2">
                      <GraduationCap className="h-3.5 w-3.5 text-[#1e3a8a]" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900">Studentgegevens</h3>
                  </div>
                  
                  <div className="bg-gray-50 border rounded-md overflow-hidden shadow-sm">
                    <div className="grid grid-cols-1 divide-y">
                      <div className="p-4 flex">
                        <div className="w-1/3">
                          <p className="text-xs font-medium text-gray-500 uppercase">Naam</p>
                        </div>
                        <div className="w-2/3">
                          <p className="font-medium text-gray-900">{selectedStudent?.firstName} {selectedStudent?.lastName}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 flex">
                        <div className="w-1/3">
                          <p className="text-xs font-medium text-gray-500 uppercase">Student ID</p>
                        </div>
                        <div className="w-2/3">
                          <p className="font-medium text-gray-900">{selectedStudent?.studentId}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 flex">
                        <div className="w-1/3">
                          <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                        </div>
                        <div className="w-2/3">
                          <p className="font-medium text-gray-900">
                            {selectedStudent?.email || <span className="text-gray-400 italic">Niet beschikbaar</span>}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4 flex">
                        <div className="w-1/3">
                          <p className="text-xs font-medium text-gray-500 uppercase">Telefoon</p>
                        </div>
                        <div className="w-2/3">
                          <p className="font-medium text-gray-900">
                            {selectedStudent?.phone || <span className="text-gray-400 italic">Niet beschikbaar</span>}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4 flex">
                        <div className="w-1/3">
                          <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                        </div>
                        <div className="w-2/3">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {selectedStudent?.status === 'enrolled' ? 'Ingeschreven' : (selectedStudent?.status || 'Actief')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  

                  

                </div>
                
                <div>
                  <div className="flex items-center mb-4">
                    <div className="h-6 w-6 rounded-full bg-[#1e3a8a]/10 flex items-center justify-center mr-2">
                      <UserCircle className="h-3.5 w-3.5 text-[#1e3a8a]" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900">Voogdgegevens</h3>
                  </div>
                  
                  <div className="bg-gray-50 border rounded-md overflow-hidden shadow-sm">
                    <div className="divide-y">
                      {guardianStudentsQuery.data && guardianStudentsQuery.data
                        .filter((rel: any) => rel.studentId === selectedStudent?.id)
                        .map((rel: any) => {
                          const guardian = guardiansData?.find((g: any) => g.id === rel.guardianId);
                          return guardian ? (
                            <div key={rel.id} className="group hover:bg-blue-50/50 transition-colors">
                              <div className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex gap-3">
                                    <Avatar className="h-10 w-10 mt-0.5">
                                      <AvatarFallback className="bg-blue-100 text-blue-700">
                                        {guardian.firstName.charAt(0)}{guardian.lastName.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900">{guardian.firstName} {guardian.lastName}</p>
                                        {rel.isPrimary && (
                                          <Badge 
                                            variant="outline" 
                                            className="px-1.5 py-0 h-5 text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                                          >
                                            Primair
                                          </Badge>
                                        )}
                                      </div>
                                      
                                      <div className="mt-1 flex items-center gap-2">
                                        <Badge 
                                          variant="outline" 
                                          className="px-1.5 py-0 h-5 text-[10px] bg-[#1e3a8a]/10 text-[#1e3a8a] border-[#1e3a8a]/20"
                                        >
                                          {getRelationshipLabel(guardian.relationship)}
                                        </Badge>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 gap-1 mt-2">
                                        {guardian.phone && (
                                          <div className="flex items-center gap-1.5">
                                            <Phone className="h-3 w-3 text-gray-400" />
                                            <span className="text-xs text-gray-600">{guardian.phone}</span>
                                          </div>
                                        )}
                                        
                                        {guardian.email && (
                                          <div className="flex items-center gap-1.5">
                                            <Mail className="h-3 w-3 text-gray-400" />
                                            <span className="text-xs text-gray-600">{guardian.email}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 invisible group-hover:visible transition-all opacity-0 group-hover:opacity-100 text-[#1e3a8a] hover:text-[#1e3a8a] hover:bg-blue-50 border-[#1e3a8a]/20"
                                      onClick={() => {
                                        setSelectedStudent(null);
                                        handleShowGuardianDetails(guardian);
                                      }}
                                    >
                                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                                      Details
                                    </Button>
                                    {guardian.isEmergencyContact && (
                                      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-600 text-[10px]">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Noodcontact
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })}
                        
                      {!guardianStudentsQuery.data || 
                      !guardianStudentsQuery.data.some((rel: any) => rel.studentId === selectedStudent?.id) && (
                        <div className="py-8 px-4">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="h-12 w-12 rounded-full bg-blue-100/50 flex items-center justify-center mb-3">
                              <UserX className="h-6 w-6 text-blue-500/30" />
                            </div>
                            <p className="text-gray-500 text-sm">
                              Geen voogden gekoppeld aan deze student
                            </p>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="mt-2 h-auto p-0 text-blue-600 text-xs"
                              onClick={() => {
                                setSelectedStudent(null);
                                handleAddNewGuardian();
                              }}
                            >
                              Voogd toevoegen
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 px-6 py-4 border-t bg-gray-50">
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setSelectedStudent(null)}
                  className="mr-2"
                >
                  Sluiten
                </Button>
                <Button
                  className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
                  onClick={() => {
                    // Hier kan een logische vervolgactie komen, bijvoorbeeld:
                    // window.location.href = `#/students/${selectedStudent?.id}/edit`;
                    setSelectedStudent(null);
                  }}
                >
                  Naar student
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verwijder dialoog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 -mx-6 -mt-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  Voogd verwijderen
                </DialogTitle>
                <DialogDescription className="text-red-100 text-sm mt-1">
                  Weet u zeker dat u deze voogd wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-5 bg-red-50 p-3 rounded-md border border-red-200">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-600">Alle koppelingen met studenten worden ook verwijderd.</p>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="mr-2"
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Verwijderen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Toevoegen/bewerken dialoog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[95%] md:max-w-[80%] lg:max-w-[70%] h-[80vh] max-h-[80vh] overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] px-6 py-4 -mx-6 -mt-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  {newGuardian.id ? 'Voogd Bewerken' : 'Nieuwe Voogd Toevoegen'}
                </DialogTitle>
                <DialogDescription className="text-blue-100 text-sm mt-1">
                  {newGuardian.id 
                    ? 'Werk de gegevens bij voor deze voogd.'
                    : 'Voeg een nieuwe voogd toe aan het systeem.'}
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmitGuardian} className="flex flex-col flex-1 overflow-hidden">
            <Tabs defaultValue="personal" className="w-full flex flex-col flex-1 overflow-hidden">
              <TabsList className="grid grid-cols-3 mb-6 bg-gray-100 rounded-lg h-12 flex-shrink-0">
                <TabsTrigger 
                  value="personal" 
                  className="flex items-center gap-2 font-medium data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-sm rounded-md"
                >
                  <User className="h-4 w-4" />
                  Persoonlijk
                </TabsTrigger>
                <TabsTrigger 
                  value="contact" 
                  className="flex items-center gap-2 font-medium data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-sm rounded-md"
                >
                  <MapPin className="h-4 w-4" />
                  Contact & Adres
                </TabsTrigger>
                <TabsTrigger 
                  value="students" 
                  className="flex items-center gap-2 font-medium data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-sm rounded-md"
                >
                  <Users className="h-4 w-4" />
                  Studenten
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="personal" className="mt-0">
                  <div className="p-4 bg-white rounded-lg min-h-[450px]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">
                          Voornaam <span className="text-primary">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={newGuardian.firstName}
                          onChange={handleInputChange}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="Voornaam"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="lastName" className="text-xs font-medium text-gray-700">
                          Achternaam <span className="text-primary">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={newGuardian.lastName}
                          onChange={handleInputChange}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="Achternaam"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                          E-mail <span className="text-primary">*</span>
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={newGuardian.email}
                          onChange={handleInputChange}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="email@example.com"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone" className="text-xs font-medium text-gray-700">
                          Telefoon
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={newGuardian.phone || ''}
                          onChange={handleInputChange}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="06 1234 5678"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="relationship" className="text-xs font-medium text-gray-700">
                          Relatie tot student
                        </Label>
                        <Select
                          name="relationship"
                          value={newGuardian.relationship}
                          onValueChange={(value) => setNewGuardian({...newGuardian, relationship: value})}
                        >
                          <SelectTrigger className="mt-1 h-9 text-sm bg-white border-gray-200">
                            <SelectValue placeholder="Selecteer relatie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="parent">Ouder</SelectItem>
                            <SelectItem value="guardian">Voogd</SelectItem>
                            <SelectItem value="family">Familie</SelectItem>
                            <SelectItem value="noodcontact">Noodcontact</SelectItem>
                            <SelectItem value="other">Anders</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-xs font-medium text-gray-700">Noodcontact</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Checkbox
                            id="isEmergencyContact"
                            name="isEmergencyContact" 
                            checked={newGuardian.isEmergencyContact}
                            onCheckedChange={(checked) => 
                              setNewGuardian({...newGuardian, isEmergencyContact: !!checked})
                            }
                          />
                          <Label 
                            htmlFor="isEmergencyContact" 
                            className="text-xs text-red-600"
                          >
                            Dit is een noodcontact
                          </Label>
                        </div>
                        {newGuardian.isEmergencyContact && (
                          <p className="text-xs text-gray-500 mt-1">
                            Deze persoon zal gecontacteerd worden in geval van nood.
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-3">
                        <Label htmlFor="notes" className="text-xs font-medium text-gray-700">
                          Notities
                        </Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          placeholder="Extra informatie over deze voogd..."
                          value={newGuardian.notes || ''}
                          onChange={handleInputChange}
                          className="mt-1 text-sm bg-white border-gray-200"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="mt-0">
                  <div className="p-4 bg-white rounded-lg min-h-[450px]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="street" className="text-xs font-medium text-gray-700">
                          Straat
                        </Label>
                        <Input
                          id="street"
                          name="street"
                          value={newGuardian.street || ''}
                          onChange={handleInputChange}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="Straatnaam"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="houseNumber" className="text-xs font-medium text-gray-700">
                          Huisnummer
                        </Label>
                        <Input
                          id="houseNumber"
                          name="houseNumber"
                          value={newGuardian.houseNumber || ''}
                          onChange={handleInputChange}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="123"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="postalCode" className="text-xs font-medium text-gray-700">
                          Postcode
                        </Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          value={newGuardian.postalCode || ''}
                          onChange={handleInputChange}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="1234 AB"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="city" className="text-xs font-medium text-gray-700">
                          Stad
                        </Label>
                        <Input
                          id="city"
                          name="city"
                          value={newGuardian.city || ''}
                          onChange={handleInputChange}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="Amsterdam"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="students" className="mt-0">
                  <div className="p-4 bg-white rounded-lg min-h-[450px]">
              {!newGuardian.id && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-800 mb-4">Koppel Studenten</h3>
                  
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="studentSearch" className="text-xs font-medium text-gray-700">Zoek student</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="studentSearch"
                        placeholder="Zoek op naam of ID..."
                        className="pl-9 mt-1 h-9 text-sm bg-white border-gray-200"
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-[350px] overflow-y-auto">
                    {studentsData
                      .filter((student: any) => 
                        filteredStudentIds.includes(student.id)  
                      )
                      .map((student: any) => (
                        <div key={student.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`student-${student.id}`}
                            checked={selectedStudentIds.includes(student.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStudentIds(prev => [...prev, student.id]);
                              } else {
                                setSelectedStudentIds(prev => prev.filter(id => id !== student.id));
                                if (primaryStudentId === student.id) {
                                  setPrimaryStudentId(null);
                                }
                              }
                            }}
                          />
                          <div className="grid gap-0.5">
                            <Label htmlFor={`student-${student.id}`} className="font-medium">
                              {student.firstName} {student.lastName}
                            </Label>
                            <p className="text-xs text-gray-500">{student.studentId}</p>
                          </div>
                        </div>
                      ))}
                    
                    {filteredStudentIds.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-3">
                        {studentSearchQuery.trim() !== ''
                          ? 'Geen studenten gevonden voor deze zoekopdracht.'
                          : 'Geen studenten beschikbaar om te koppelen.'}
                      </p>
                    )}
                  </div>
                  
                  {selectedStudentIds.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-base font-semibold mb-2">Geselecteerde studenten:</h4>
                      <div className="space-y-3">
                        {selectedStudentIds.map(id => {
                          const student = studentsData.find((s: any) => s.id === id);
                          return (
                            <div key={id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                    {student?.firstName.charAt(0)}{student?.lastName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{student?.firstName} {student?.lastName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    setSelectedStudentIds(prev => prev.filter(studentId => studentId !== id));
                                    if (primaryStudentId === id) {
                                      setPrimaryStudentId(null);
                                    }
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
                  </div>
              </TabsContent>
              </div>
            </Tabs>
            
            <div className="mt-8 mb-12 flex gap-4 justify-end pr-8">
              <Button 
                type="button" 
                variant="outline" 
                size="lg"
                onClick={() => setShowAddDialog(false)}
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                size="lg"
                className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
              >
                {newGuardian.id ? 'Opslaan' : 'Toevoegen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}