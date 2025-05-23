import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Download, Eye, Pencil, Trash2, Users, UserCheck, X, UserCircle, Mail, Home, BookOpen, Phone, XCircle } from 'lucide-react';
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
};

export default function Guardians() {
  // URL parameters gebruiken voor automatisch openen van voogdbewerking
  const [searchParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      editId: params.get('edit'),
      returnToStudent: params.get('returnToStudent') === 'true'
    };
  });
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianType | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'emergency'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // States voor verwijderbevestiging
  const [guardianToDelete, setGuardianToDelete] = useState<GuardianType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newGuardian, setNewGuardian] = useState<Partial<GuardianType>>({
    firstName: '',
    lastName: '',
    relationship: 'parent',
    email: '',
    phone: '',
    address: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    isEmergencyContact: false,
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    notes: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debounce search term
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
//Deze effecthook wordt later toegevoegd nadat guardians is gedefinieerd
  
  // Handle navigation after saving
  useEffect(() => {
    // Als we het dialoogvenster sluiten na het bewerken van een voogd vanuit een student
    if (!showAddDialog && searchParams.returnToStudent) {
      // Navigeer terug naar studenten pagina om het studentformulier weer te openen
      window.location.href = '/students?add=true';
    }
  }, [showAddDialog, searchParams.returnToStudent]);

  // Fetch guardians data
  const {
    data: guardiansResponse,
    isLoading,
    isError,
    refetch
  } = useQuery<GuardianType[]>({
    queryKey: ['/api/guardians', { page: currentPage, limit: itemsPerPage, search: debouncedSearch }],
  });
  
  // Extract guardians with proper type safety and create a fallback for pagination
  const guardians: GuardianType[] = Array.isArray(guardiansResponse) ? guardiansResponse : [];
  const totalGuardians: number = guardians.length; // Gebruik de daadwerkelijke lengte van de array
  
  const totalPages = Math.ceil(totalGuardians / itemsPerPage);
  
  // Auto-open edit dialog when navigating from student page with a guardian ID
  useEffect(() => {
    const editGuardianId = searchParams.editId;
    if (editGuardianId && guardians.length > 0) {
      // Zoek de voogd in de lijst
      const guardianToEdit = guardians.find(g => g.id.toString() === editGuardianId);
      if (guardianToEdit) {
        // Open het dialoogvenster voor bewerking
        setNewGuardian({...guardianToEdit});
        setShowAddDialog(true);
        
        // Toon een toast om aan te geven dat we in de bewerkmodus zitten
        toast({
          title: "Voogd bewerken",
          description: "U bewerkt een voogd die u wilt koppelen aan een student.",
        });
      }
    }
  }, [searchParams.editId, guardians, toast]);
  
  // Controleer of we een noodcontactnummer moeten openen vanuit de studentenpagina
  useEffect(() => {
    // Check of er een noodcontactnummer in localStorage is gezet
    const noodcontactPhone = localStorage.getItem('temp_noodcontact_phone');
    const shouldOpenDialog = localStorage.getItem('open_guardian_dialog');
    const returnToStudent = localStorage.getItem('temp_student_return');
    
    if (noodcontactPhone && shouldOpenDialog === 'true') {
      // Verwijder de flags uit localStorage
      localStorage.removeItem('temp_noodcontact_phone');
      localStorage.removeItem('open_guardian_dialog');
      
      // Open een nieuwe voogd dialoog met het noodcontactnummer ingevuld
      setNewGuardian({
        firstName: "",
        lastName: "",
        relationship: "noodcontact",
        email: "",
        phone: noodcontactPhone,
        isEmergencyContact: true,
        street: "",
        houseNumber: "",
        postalCode: "",
        city: ""
      });
      
      setShowAddDialog(true);
      setIsEditMode(false);
      
      // Toon een toast met instructies
      toast({
        title: "Noodcontact toevoegen",
        description: "Vul de gegevens voor het noodcontact aan en sla op.",
      });
    }
  }, [toast]);
  
  // Fetch all students for student assignment
  const {
    data: allStudents = [] as StudentType[],
    isLoading: allStudentsLoading,
    isError: isAllStudentsError,
  } = useQuery<StudentType[]>({
    queryKey: ['/api/students'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/students');
      } catch (error) {
        console.error('Error fetching students for assignment:', error);
        toast({
          title: "Fout bij ophalen studenten",
          description: "Kon de lijst met studenten niet laden voor toewijzing.",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  // Fetch associated students for selected guardian or guardian being edited
  const guardianIdForStudents = selectedGuardian?.id || (showAddDialog && newGuardian.id ? newGuardian.id : undefined);
  
  const {
    data: guardianStudentsData = [] as any[],
    isLoading: guardianStudentsLoading,
    isError: isGuardianStudentsError,
    refetch: refetchGuardianStudents
  } = useQuery({
    queryKey: ['/api/guardians/students', guardianIdForStudents],
    queryFn: async () => {
      if (!guardianIdForStudents) return [];
      try {
        return await apiRequest(`/api/guardians/${guardianIdForStudents}/students`);
      } catch (error) {
        console.error('Error fetching guardian students:', error);
        toast({
          title: "Fout bij ophalen gerelateerde studenten",
          description: "Kon de studenten die aan deze voogd gekoppeld zijn niet laden.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!guardianIdForStudents,
  });

  // Ververs de gekoppelde studenten wanneer een voogd wordt toegevoegd of bijgewerkt
  useEffect(() => {
    if (guardianIdForStudents && refetchGuardianStudents) {
      refetchGuardianStudents();
    }
  }, [guardianIdForStudents, refetchGuardianStudents, showAddDialog, isEditMode]);

  // Delete Guardian mutation
  const deleteGuardianMutation = useMutation({
    mutationFn: async (guardianId: number) => {
      try {
        return await apiRequest(`/api/guardians/${guardianId}`, {
          method: 'DELETE'
        });
      } catch (error: any) {
        console.error('Delete guardian error:', error);
        throw new Error(error?.message || 'Fout bij het verwijderen van voogd');
      }
    },
    onSuccess: () => {
      toast({
        title: "Voogd verwijderd",
        description: "De voogd is succesvol verwijderd uit het systeem",
      });
      // Invalideer alle relevante queries
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-guardians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/guardian-students'] });
      
      setSelectedGuardian(null);
      setIsDeleteDialogOpen(false);
      setGuardianToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error?.message || "Er is een fout opgetreden bij het verwijderen van de voogd. Mogelijk zijn er nog actieve relaties met studenten.",
        variant: "destructive",
      });
      console.error('Delete error:', error);
      setIsDeleteDialogOpen(false);
    },
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Handle adding a new guardian
  const handleAddNewGuardian = () => {
    setNewGuardian({
      firstName: '',
      lastName: '',
      relationship: 'parent',
      email: '',
      phone: '',
      address: '',
      street: '',
      houseNumber: '',
      postalCode: '',
      city: '',
      isEmergencyContact: false,
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      notes: ''
    });
    setSelectedStudentIds([]);
    setShowAddDialog(true);
    setIsEditMode(false);
    console.log("Add new guardian");
  };
  
  // Add/Update Guardian mutation
  const guardianMutation = useMutation({
    mutationFn: async (data: { guardian: Partial<GuardianType>, studentIds: number[] }) => {
      try {
        let guardian;
        
        if (data.guardian.id) {
          // Update existing guardian
          guardian = await apiRequest(`/api/guardians/${data.guardian.id}`, {
            method: 'PUT',
            body: data.guardian
          });
        } else {
          // Create new guardian
          guardian = await apiRequest('/api/guardians', {
            method: 'POST',
            body: data.guardian
          });
          
          // Assign students if any were selected (only for new guardians)
          if (data.studentIds.length > 0 && guardian.id) {
            const studentGuardianPromises = data.studentIds.map(studentId => 
              apiRequest('/api/student-guardians', {
                method: 'POST',
                body: {
                  studentId,
                  guardianId: guardian.id
                }
              })
            );
            await Promise.all(studentGuardianPromises);
          }
        }
        
        return guardian;
      } catch (error: any) {
        console.error('Guardian mutation error:', error);
        throw new Error(error?.message || 'Fout bij het opslaan van voogdgegevens');
      }
    },
    onSuccess: (result, variables) => {
      const isEdit = !!variables.guardian.id;
      toast({
        title: isEdit ? "Voogd bijgewerkt" : "Voogd toegevoegd",
        description: isEdit 
          ? `De gegevens van ${variables.guardian.firstName} ${variables.guardian.lastName} zijn succesvol bijgewerkt.` 
          : `${variables.guardian.firstName} ${variables.guardian.lastName} is succesvol toegevoegd${variables.studentIds.length > 0 ? ' en gekoppeld aan de geselecteerde studenten' : ''}.`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/guardians/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-guardians'] });
      
      // Reset UI state
      setShowAddDialog(false);
      setSelectedStudentIds([]);
      
      // Reset form data
      setNewGuardian({
        firstName: '',
        lastName: '',
        relationship: 'parent',
        email: '',
        phone: '',
        address: '',
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        isEmergencyContact: false,
        notes: ''
      });
    },
    onError: (error: any, variables) => {
      const isEdit = !!variables.guardian.id;
      toast({
        title: isEdit ? "Fout bij bijwerken" : "Fout bij toevoegen",
        description: error?.message || (isEdit 
          ? "Er is een fout opgetreden bij het bijwerken van de voogdgegevens. Controleer of alle verplichte velden correct zijn ingevuld." 
          : "Er is een fout opgetreden bij het toevoegen van de voogd. Controleer of alle verplichte velden correct zijn ingevuld."),
        variant: "destructive",
      });
      console.error(isEdit ? 'Update guardian error:' : 'Add guardian error:', error);
    },
  });
  
  // Handle form submission
  const handleSubmitGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    guardianMutation.mutate({
      guardian: newGuardian,
      studentIds: selectedStudentIds
    });
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle checkboxes separately
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setNewGuardian({ ...newGuardian, [name]: checked });
    } else {
      setNewGuardian({ ...newGuardian, [name]: value });
    }
  };

  // Handle editing a guardian
  const handleEditGuardian = (guardian: GuardianType) => {
    setNewGuardian({
      ...guardian
    });
    setShowAddDialog(true);
    setIsEditMode(true);
    console.log("Edit guardian:", guardian);
  };

  // Handle deleting a guardian - open confirmation dialog
  const handleDeleteGuardian = (guardian: GuardianType) => {
    setGuardianToDelete(guardian);
    setIsDeleteDialogOpen(true);
  };
  
  // Confirm guardian deletion after dialog confirmation
  const confirmDeleteGuardian = () => {
    if (guardianToDelete) {
      deleteGuardianMutation.mutate(guardianToDelete.id);
    }
  };

  // Handle viewing a guardian's details
  const handleViewGuardian = (guardian: GuardianType) => {
    setSelectedGuardian(guardian);
  };

  // Get relationship label
  const getRelationshipLabel = (relationship: string): string => {
    const relationships: Record<string, string> = {
      "parent": "Ouder",
      "guardian": "Voogd",
      "grandparent": "Grootouder",
      "sibling": "Broer/Zus",
      "other": "Andere"
    };
    return relationships[relationship] || relationship;
  };
  
  // Get status label in Dutch
  const getStatusLabel = (status: string): string => {
    const statuses: Record<string, string> = {
      "Active": "Actief",
      "Inactive": "Inactief",
      "Pending": "In Afwachting",
      "Graduated": "Afgestudeerd",
      "Withdrawn": "Teruggetrokken",
      "Suspended": "Geschorst"
    };
    return statuses[status] || status;
  };

  // Render guardians page
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Voogd verwijderen</DialogTitle>
            <DialogDescription>
              Weet u zeker dat u {guardianToDelete?.firstName} {guardianToDelete?.lastName} wilt verwijderen?
              {guardianStudentsData && guardianStudentsData.length > 0 && (
                <div className="mt-2 text-red-500">
                  <span className="font-semibold">Let op:</span> Deze voogd is aan {guardianStudentsData.length} student{guardianStudentsData.length !== 1 ? 'en' : ''} gekoppeld.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteGuardianMutation.isPending}
            >
              Annuleren
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteGuardian}
              disabled={deleteGuardianMutation.isPending}
              className="gap-1"
            >
              {deleteGuardianMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Bezig met verwijderen...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Verwijderen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Page Title */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col md:flex-row md:items-center border-b border-gray-200 pb-4 w-full">
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <div className="p-3 rounded-md bg-[#1e3a8a] text-white">
              <UserCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Voogden</h1>
              <p className="text-base text-gray-500 mt-1">Beheer voogden en hun relaties met studenten</p>
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
            className="pl-8 bg-white"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      
      {/* View tabs & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'all' | 'emergency')}>
            <TabsList className="p-1 bg-blue-900/10">
              <TabsTrigger 
                value="all" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md"
              >
                <UserCheck className="h-4 w-4" />
                Alle Voogden
              </TabsTrigger>
              <TabsTrigger 
                value="emergency" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="h-4 w-4"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Noodcontacten
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <Button 
          onClick={handleAddNewGuardian} 
          variant="default" 
          size="default" 
          className="bg-primary hover:bg-primary/90"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Voogd Toevoegen</span>
        </Button>
      </div>
      
      {/* Voogden lijst */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Voogd
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relatie</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-red-500">
                    Fout bij het laden van voogden. Probeer het opnieuw.
                  </td>
                </tr>
              ) : guardians.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="h-48 flex flex-col items-center justify-center text-gray-500">
                      <div className="text-[#1e3a8a] mb-2">
                        <UserCheck className="h-12 w-12 mx-auto opacity-30" />
                      </div>
                      <p className="text-sm font-medium">Geen voogden beschikbaar</p>
                    </div>
                  </td>
                </tr>
              ) : (
                guardians
                  .filter(guardian => viewMode === 'all' || guardian.isEmergencyContact)
                  .map((guardian: GuardianType) => (
                  <tr key={guardian.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-[#1e3a8a] text-white">
                            {guardian.firstName.charAt(0)}{guardian.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{guardian.firstName} {guardian.lastName}</div>
                          <div className="text-xs text-gray-500">{guardian.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getRelationshipLabel(guardian.relationship)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {guardian.isEmergencyContact ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                          </svg>
                          Noodcontact
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Standaard
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex justify-center items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewGuardian(guardian)}
                          className="h-8 w-8 p-0"
                        >
                          <span className="sr-only">Bekijken</span>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditGuardian(guardian)}
                          className="h-8 w-8 p-0"
                        >
                          <span className="sr-only">Bewerken</span>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGuardian(guardian)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <span className="sr-only">Verwijderen</span>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!isLoading && !isError && totalPages > 1 && (
          <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="hidden sm:block">
              <p className="text-sm text-gray-700">
                Pagina <span className="font-medium">{currentPage}</span> van <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div className="flex-1 flex justify-center sm:justify-end">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Vorige</span>
                  &larr;
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                      currentPage === i + 1
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Volgende</span>
                  &rarr;
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
      
      {/* Voogd details dialoog */}
      <Dialog open={!!selectedGuardian} onOpenChange={() => setSelectedGuardian(null)}>
        <DialogContent className="w-[95vw] max-h-[85vh] overflow-y-auto bg-gradient-to-b from-white to-blue-50/40">
          <DialogHeader className="border-b pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M3 8a13 13 0 0 1 18 0"></path>
                  <path d="M21 8a13 13 0 0 0-18 0"></path>
                </svg>
              </div>
              <div>
                <DialogTitle className="text-primary text-xl font-bold">Voogd Details</DialogTitle>
                <DialogDescription className="text-gray-500">
                  Gedetailleerde informatie over {selectedGuardian?.firstName} {selectedGuardian?.lastName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedGuardian && (
            <div className="mt-2">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid grid-cols-5 mb-6">
                  <TabsTrigger value="personal" className="flex gap-2 items-center">
                    <UserCircle className="h-4 w-4" />
                    Persoonlijk
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="flex gap-2 items-center">
                    <Mail className="h-4 w-4" />
                    Contact
                  </TabsTrigger>
                  <TabsTrigger value="address" className="flex gap-2 items-center">
                    <Home className="h-4 w-4" />
                    Adres
                  </TabsTrigger>
                  <TabsTrigger value="class" className="flex gap-2 items-center">
                    <Users className="h-4 w-4" />
                    Klas
                  </TabsTrigger>
                  <TabsTrigger value="courses" className="flex gap-2 items-center">
                    <BookOpen className="h-4 w-4" />
                    Vakken
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal" className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/2 space-y-5">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="bg-[#1e3a8a] text-white text-xl">
                            {selectedGuardian.firstName.charAt(0)}{selectedGuardian.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="text-xl font-bold">{selectedGuardian.firstName} {selectedGuardian.lastName}</h2>
                          <p className="text-gray-500">{getRelationshipLabel(selectedGuardian.relationship)}</p>
                          {selectedGuardian.isEmergencyContact && (
                            <Badge variant="destructive" className="mt-1">Noodcontact</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Relatie
                          </Label>
                          <div className="mt-1 p-2 border rounded-md bg-gray-50">
                            {getRelationshipLabel(selectedGuardian.relationship)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-1/2 space-y-5">
                      {selectedGuardian.notes && (
                        <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                          <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-3 block">
                            Notities
                          </Label>
                          <div className="p-3 bg-gray-50 rounded-md min-h-[120px] border border-gray-200 text-sm">
                            {selectedGuardian.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="contact" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Email</Label>
                      <div className="p-2 border rounded-md bg-gray-50">
                        {selectedGuardian.email}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Telefoonnummer</Label>
                      <div className="p-2 border rounded-md bg-gray-50">
                        {selectedGuardian.phone || 'Niet ingevuld'}
                      </div>
                    </div>
                  </div>
                  
                  {(selectedGuardian.emergencyContactName || selectedGuardian.emergencyContactPhone) && (
                    <div className="mt-4 p-4 border rounded-md bg-blue-50">
                      <div className="flex items-center mb-2">
                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700">
                            <path d="M13.73 21a9.97 9.97 0 0 1-10.5-10.05C3.25 6.75 6.8 3.25 11 3.25v2a.75.75 0 0 0 1.5 0v-2a.75.75 0 0 0-1.5 0" />
                            <path d="m12.92 6.74 5.56 5.56a1 1 0 0 1-1.41 1.41l-5.56-5.56a.997.997 0 0 1 0-1.41.997.997 0 0 1 1.41 0Z" />
                            <path d="M16.24 20.25 3.75 7.76" />
                          </svg>
                        </div>
                        <Label className="text-sm font-medium text-blue-700">Secundair Noodcontact</Label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Naam</Label>
                          <div className="p-2 border rounded-md bg-white">
                            {selectedGuardian.emergencyContactName || 'Niet ingevuld'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Telefoonnummer</Label>
                          <div className="p-2 border rounded-md bg-white">
                            {selectedGuardian.emergencyContactPhone || 'Niet ingevuld'}
                          </div>
                        </div>
                      </div>
                      
                      {selectedGuardian.emergencyContactRelation && (
                        <div className="space-y-1 mt-2">
                          <Label className="text-xs text-gray-500">Relatie tot student</Label>
                          <div className="p-2 border rounded-md bg-white">
                            {selectedGuardian.emergencyContactRelation === 'parent' && 'Ouder'}
                            {selectedGuardian.emergencyContactRelation === 'family' && 'Familielid'}
                            {selectedGuardian.emergencyContactRelation === 'friend' && 'Vriend(in)'}
                            {selectedGuardian.emergencyContactRelation === 'neighbor' && 'Buur'}
                            {selectedGuardian.emergencyContactRelation === 'other' && 'Anders'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2 mt-4">
                    <Label className="text-sm font-medium">Adres</Label>
                    <div className="p-2 border rounded-md bg-gray-50">
                      {selectedGuardian.street && selectedGuardian.houseNumber
                        ? `${selectedGuardian.street} ${selectedGuardian.houseNumber}`
                        : 'Straat niet ingevuld'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Postcode</Label>
                      <div className="p-2 border rounded-md bg-gray-50">
                        {selectedGuardian.postalCode || 'Niet ingevuld'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Plaats</Label>
                      <div className="p-2 border rounded-md bg-gray-50">
                        {selectedGuardian.city || 'Niet ingevuld'}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="students" className="space-y-4 pt-4">
                  {guardianStudentsLoading ? (
                    <div className="flex justify-center my-4">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : guardianStudentsData.length === 0 ? (
                    <div className="text-center p-6 bg-gray-50 rounded-md text-gray-500">
                      Deze voogd heeft geen gekoppelde studenten
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-md font-medium">Toegewezen studenten</h3>
                      
                      <div className="border rounded-md divide-y">
                        {guardianStudentsData.map((relation: any) => {
                          console.log("Relation data in map:", relation);
                          return (
                            <div
                              key={relation.id}
                              className="flex items-center p-3 hover:bg-gray-50"
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-[#1e3a8a] text-white">
                                  {relation.student?.firstName?.[0] || '?'}{relation.student?.lastName?.[0] || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-3">
                                {relation.student ? (
                                  <>
                                    <div className="text-sm font-medium">{relation.student.firstName} {relation.student.lastName}</div>
                                    <div className="text-xs text-gray-500">Studentnr: {relation.student.studentId}</div>
                                  </>
                                ) : (
                                  <div className="text-sm text-gray-500">Student #{relation.studentId}</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter className="mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setSelectedGuardian(null)}
            >
              Sluiten
            </Button>
            {selectedGuardian && (
              <Button
                onClick={() => handleEditGuardian(selectedGuardian)}
                className="bg-[#3b5998] hover:bg-[#2d4373]"
              >
                Bewerken
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add/Edit Guardian Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[85%] max-h-[90vh] h-auto overflow-y-auto">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center text-primary">
              <div className="bg-blue-100 rounded-full p-1.5 mr-3">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              {newGuardian.id ? 'Voogd Bewerken' : 'Nieuwe Voogd Toevoegen'}
            </DialogTitle>
            <DialogDescription className="text-gray-500 mt-1">
              {newGuardian.id 
                ? 'Werk de informatie bij voor deze voogd.' 
                : 'Vul alle benodigde informatie in om een nieuwe voogd toe te voegen.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitGuardian} className="mt-4 space-y-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3 p-1 bg-blue-900/10 rounded-md mb-4">
                <TabsTrigger value="personal" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                  <UserCircle className="h-4 w-4" />
                  <span>Persoonlijke Informatie</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                  <Phone className="h-4 w-4" />
                  <span>Contactgegevens</span>
                </TabsTrigger>
                <TabsTrigger value="students" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                  <Users className="h-4 w-4" />
                  <span>Studenten</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-0">
                {/* Basisinformatie */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Voornaam</Label>
                    <Input 
                      id="firstName"
                      name="firstName"
                      value={newGuardian.firstName || ''}
                      onChange={handleInputChange}
                      placeholder="Voornaam"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Achternaam</Label>
                    <Input 
                      id="lastName"
                      name="lastName"
                      value={newGuardian.lastName || ''}
                      onChange={handleInputChange}
                      placeholder="Achternaam"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relationship">Relatie tot student</Label>
                    <Select 
                      name="relationship"
                      value={newGuardian.relationship || 'parent'}
                      onValueChange={(value) => setNewGuardian({...newGuardian, relationship: value})}
                    >
                      <SelectTrigger>
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
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="isEmergencyContact" 
                      name="isEmergencyContact"
                      checked={newGuardian.isEmergencyContact || false}
                      onCheckedChange={(checked) => setNewGuardian({...newGuardian, isEmergencyContact: checked === true})}
                    />
                    <Label htmlFor="isEmergencyContact" className="cursor-pointer">
                      Noodcontact
                    </Label>
                  </div>
                  
                  {newGuardian.isEmergencyContact && (
                    <div className="ml-7 border-l-2 pl-4 border-blue-200 space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="hasSecondaryContact" 
                          checked={!!(newGuardian.emergencyContactName || newGuardian.emergencyContactPhone || newGuardian.emergencyContactRelation)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Als het vakje wordt aangevinkt, zet lege waarden
                              setNewGuardian({
                                ...newGuardian,
                                emergencyContactName: ' ', // Spatie om te zorgen dat de velden verschijnen
                                emergencyContactPhone: '',
                                emergencyContactRelation: ''
                              });
                            } else {
                              // Als het vakje wordt uitgevinkt, verwijder de waarden
                              setNewGuardian({
                                ...newGuardian,
                                emergencyContactName: '',
                                emergencyContactPhone: '',
                                emergencyContactRelation: ''
                              });
                            }
                          }}
                        />
                        <Label htmlFor="hasSecondaryContact" className="cursor-pointer">
                          Secundair noodcontact opgeven
                        </Label>
                      </div>
                      
                      {!!(newGuardian.emergencyContactName || newGuardian.emergencyContactPhone || newGuardian.emergencyContactRelation) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                          <div className="space-y-2">
                            <Label htmlFor="emergencyContactName">Naam</Label>
                            <Input 
                              id="emergencyContactName"
                              name="emergencyContactName"
                              value={newGuardian.emergencyContactName || ''}
                              onChange={handleInputChange}
                              placeholder="Volledige naam van noodcontact"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="emergencyContactPhone">Telefoonnummer</Label>
                            <Input 
                              id="emergencyContactPhone"
                              name="emergencyContactPhone"
                              value={newGuardian.emergencyContactPhone || ''}
                              onChange={handleInputChange}
                              placeholder="06-12345678"
                            />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label htmlFor="emergencyContactRelation">Relatie tot student</Label>
                            <Select 
                              name="emergencyContactRelation"
                              value={newGuardian.emergencyContactRelation || ''}
                              onValueChange={(value) => setNewGuardian({...newGuardian, emergencyContactRelation: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecteer relatie" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="parent">Ouder</SelectItem>
                                <SelectItem value="family">Familielid</SelectItem>
                                <SelectItem value="friend">Vriend(in)</SelectItem>
                                <SelectItem value="neighbor">Buur</SelectItem>
                                <SelectItem value="other">Anders</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notities</Label>
                  <Textarea 
                    id="notes"
                    name="notes"
                    value={newGuardian.notes || ''}
                    onChange={handleInputChange}
                    placeholder="Notities over deze voogd..."
                    className="min-h-[120px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-[#3b5998]">*</span></Label>
                    <Input 
                      id="email"
                      name="email"
                      type="email"
                      value={newGuardian.email || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefoonnummer <span className="text-[#3b5998]">*</span></Label>
                    <Input 
                      id="phone"
                      name="phone"
                      value={newGuardian.phone || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Verwijder de secundaire noodcontact sectie hier omdat deze nu in het persoonlijk tabblad zit */}

                <div className="space-y-2">
                  <Label htmlFor="street">Straat</Label>
                  <Input 
                    id="street"
                    name="street"
                    value={newGuardian.street || ''}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="houseNumber">Huisnummer</Label>
                    <Input 
                      id="houseNumber"
                      name="houseNumber"
                      value={newGuardian.houseNumber || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postcode</Label>
                    <Input 
                      id="postalCode"
                      name="postalCode"
                      value={newGuardian.postalCode || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Plaats</Label>
                    <Input 
                      id="city"
                      name="city"
                      value={newGuardian.city || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="students" className="space-y-4 pt-4">
                <div className="space-y-4">
                  <h3 className="text-md font-medium">Studenten toewijzen</h3>
                  <p className="text-sm text-gray-500">
                    Selecteer de studenten die aan deze voogd moeten worden toegewezen.
                  </p>
                  
                  <div className="relative">
                    <Input
                      placeholder="Zoek studenten..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  
                  {allStudentsLoading ? (
                    <div className="flex justify-center my-4">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : allStudents.length === 0 ? (
                    <div className="text-center p-4 bg-gray-50 rounded-md">
                      <p className="text-gray-500">Geen studenten gevonden.</p>
                    </div>
                  ) : (
                    <div className="border rounded-md divide-y">
                      {allStudents
                        .filter((student: StudentType) => 
                          studentSearchTerm === '' || 
                          `${student.firstName} ${student.lastName}`.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                          student.studentId.toLowerCase().includes(studentSearchTerm.toLowerCase())
                        )
                        .map((student: StudentType) => (
                          <div key={student.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center">
                              <Checkbox 
                                id={`student-${student.id}`}
                                checked={selectedStudentIds.includes(student.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedStudentIds([...selectedStudentIds, student.id]);
                                  } else {
                                    setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                                  }
                                }}
                              />
                              <Label htmlFor={`student-${student.id}`} className="ml-2 cursor-pointer">
                                <div className="font-medium">{student.firstName} {student.lastName}</div>
                                <div className="text-xs text-gray-500">#{student.studentId}</div>
                              </Label>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                
                {newGuardian.id && (
                  <div className="mt-6">
                    <h3 className="text-md font-medium mb-2">Huidige gekoppelde studenten</h3>
                    <div className="border rounded-md p-4">
                      {guardianStudentsLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span className="ml-2">Gegevens laden...</span>
                        </div>
                      ) : (
                        <div>
                          {guardianStudentsData && (guardianStudentsData.length > 0) ? (
                            <div className="space-y-2">
                              {guardianStudentsData.map((studentGuardian: any) => (
                                <div key={studentGuardian.id} className="flex justify-between items-center p-2 border-b">
                                  <div>
                                    <p className="font-medium">{studentGuardian.student?.firstName} {studentGuardian.student?.lastName}</p>
                                    <p className="text-xs text-gray-500">#{studentGuardian.student?.studentId}</p>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 text-red-500 hover:text-red-700"
                                    onClick={() => {
                                      // Implementeer verwijderen van de koppeling in toekomstige versie
                                      console.log("Ontkoppel student:", studentGuardian);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <p>Deze voogd is nog niet gekoppeld aan studenten.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => setShowAddDialog(false)}
              >
                Annuleren
              </Button>
              <Button 
                type="submit" 
                className="bg-[#3b5998] hover:bg-[#2d4373]" 
                disabled={guardianMutation.isPending}
              >
                {guardianMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Bezig met opslaan...
                  </>
                ) : (
                  newGuardian.id ? 'Voogd Bijwerken' : 'Voogd Toevoegen'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}