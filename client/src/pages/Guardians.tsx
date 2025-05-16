import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Download, Eye, Pencil, Trash2, Users, X } from 'lucide-react';
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
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianType | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'emergency'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
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

  // Fetch guardians data
  const {
    data: guardiansResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['/api/guardians', { page: currentPage, limit: itemsPerPage, search: debouncedSearch }],
  });

  // Extract guardians and total count from response
  console.log('Guardians response type:', typeof guardiansResponse, Array.isArray(guardiansResponse));
  
  // Check if response is already an array or needs to be extracted
  const guardians = Array.isArray(guardiansResponse) 
    ? guardiansResponse 
    : (guardiansResponse?.guardians || []);
    
  const totalGuardians = Array.isArray(guardiansResponse) 
    ? guardiansResponse.length 
    : (guardiansResponse?.totalCount || 0);
  
  const totalPages = Math.ceil(totalGuardians / itemsPerPage);

  // Fetch all students for student assignment
  const {
    data: allStudents = [] as StudentType[],
    isLoading: allStudentsLoading,
  } = useQuery({
    queryKey: ['/api/students'],
  });

  // Fetch associated students for selected guardian
  const {
    data: guardianStudentsData = [],
    isLoading: guardianStudentsLoading,
  } = useQuery({
    queryKey: ['/api/guardian-students', selectedGuardian?.id],
    enabled: !!selectedGuardian,
  });

  // Delete Guardian mutation
  const deleteGuardianMutation = useMutation({
    mutationFn: async (guardianId: number) => {
      return await apiRequest('DELETE', `/api/guardians/${guardianId}`);
    },
    onSuccess: () => {
      toast({
        title: "Voogd verwijderd",
        description: "De voogd is succesvol verwijderd",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      setSelectedGuardian(null);
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de voogd",
        variant: "destructive",
      });
      console.error('Delete error:', error);
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
      notes: ''
    });
    setSelectedStudentIds([]);
    setShowAddDialog(true);
    console.log("Add new guardian");
  };
  
  // Add/Update Guardian mutation
  const guardianMutation = useMutation({
    mutationFn: async (data: { guardian: Partial<GuardianType>, studentIds: number[] }) => {
      let guardian;
      
      if (data.guardian.id) {
        // Update existing guardian
        guardian = await apiRequest('PUT', `/api/guardians/${data.guardian.id}`, data.guardian);
      } else {
        // Create new guardian
        guardian = await apiRequest('POST', '/api/guardians', data.guardian);
        
        // Assign students if any were selected (only for new guardians)
        if (data.studentIds.length > 0 && guardian.id) {
          const studentGuardianPromises = data.studentIds.map(studentId => 
            apiRequest('POST', '/api/student-guardians', {
              studentId,
              guardianId: guardian.id
            })
          );
          await Promise.all(studentGuardianPromises);
        }
      }
      
      return guardian;
    },
    onSuccess: (_, variables) => {
      const isEdit = !!variables.guardian.id;
      toast({
        title: isEdit ? "Voogd bijgewerkt" : "Voogd toegevoegd",
        description: isEdit 
          ? "De voogd is succesvol bijgewerkt" 
          : "De voogd is succesvol toegevoegd met de geselecteerde studenten",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/guardian-students'] });
      setShowAddDialog(false);
      setSelectedStudentIds([]);
    },
    onError: (error, variables) => {
      const isEdit = !!variables.guardian.id;
      toast({
        title: isEdit ? "Fout bij bijwerken" : "Fout bij toevoegen",
        description: isEdit 
          ? "Er is een fout opgetreden bij het bijwerken van de voogd" 
          : "Er is een fout opgetreden bij het toevoegen van de voogd",
        variant: "destructive",
      });
      console.error(isEdit ? 'Update error:' : 'Add error:', error);
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
    console.log("Edit guardian:", guardian);
  };

  // Handle deleting a guardian
  const handleDeleteGuardian = (guardian: GuardianType) => {
    if (window.confirm(`Weet je zeker dat je ${guardian.firstName} ${guardian.lastName} wilt verwijderen?`)) {
      deleteGuardianMutation.mutate(guardian.id);
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
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Voogdenbeheer</h1>
          <p className="text-sm text-gray-500 mt-1">Beheer voogden en hun relaties met studenten</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <Button onClick={handleAddNewGuardian} className="flex items-center bg-[#3b5998] hover:bg-[#2d4373]">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Voogd Toevoegen</span>
          </Button>
        </div>
      </div>
      
      {/* View tabs */}
      <div className="flex space-x-2">
        <Button 
          variant={viewMode === 'all' ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode('all')}
          className={viewMode === 'all' ? "bg-[#3b5998] hover:bg-[#2d4373]" : "border-primary/30 text-primary hover:bg-primary/5"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M3 12h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m12.1-.7-.7.7m0 11.4.7.7m-12.1-.7-.7.7"></path>
          </svg>
          Alle Voogden
        </Button>
        <Button 
          variant={viewMode === 'emergency' ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode('emergency')}
          className={viewMode === 'emergency' ? "bg-[#3b5998] hover:bg-[#2d4373]" : "border-primary/30 text-primary hover:bg-primary/5"}
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
            className="mr-2 h-4 w-4"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          Noodcontacten
        </Button>
      </div>
      
      {/* Voogden lijst */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-end items-center">
          <div className="relative">
            <Input
              placeholder="Zoek voogden..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>
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
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Geen voogden gevonden.
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
                          <AvatarFallback className="bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700">
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
        <DialogContent className="w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M3 12h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m12.1-.7-.7.7m0 11.4.7.7m-12.1-.7-.7.7"></path>
              </svg>
              Voogd Details
            </DialogTitle>
            <DialogDescription>
              Gedetailleerde informatie over {selectedGuardian?.firstName} {selectedGuardian?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedGuardian && (
            <div className="mt-4">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal">Persoonlijke Informatie</TabsTrigger>
                  <TabsTrigger value="contact">Contactgegevens</TabsTrigger>
                  <TabsTrigger value="students">Gekoppelde Studenten</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal" className="space-y-4 pt-4">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary/10 text-primary">
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
                  
                  {selectedGuardian.notes && (
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-md font-medium mb-2">Notities</h3>
                      <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
                        {selectedGuardian.notes}
                      </div>
                    </div>
                  )}
                  
                  {/* Gekoppelde studenten sectie */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-md font-medium mb-3">Gekoppelde Studenten</h3>
                    
                    {guardianStudentsLoading ? (
                      <div className="flex justify-center my-4">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : guardianStudentsData.length === 0 ? (
                      <div className="text-center p-6 bg-gray-50 rounded-md text-gray-500">
                        Deze voogd heeft geen gekoppelde studenten
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {guardianStudentsData.map((relation: any) => (
                          <div
                            key={relation.id}
                            className="flex items-center p-3 border rounded-md hover:bg-gray-50"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-green-50 to-green-100 text-green-600">
                                {relation.student?.firstName?.charAt(0)}{relation.student?.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-3">
                              <div className="text-sm font-medium">{relation.student?.firstName} {relation.student?.lastName}</div>
                              <div className="text-xs text-gray-500">Studentnr: {relation.student?.studentId}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                        {guardianStudentsData.map((relation: any) => (
                          <div
                            key={relation.id}
                            className="flex items-center p-3 hover:bg-gray-50"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-green-50 to-green-100 text-green-600">
                                {relation.student?.firstName?.charAt(0)}{relation.student?.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-3">
                              <div className="text-sm font-medium">{relation.student?.firstName} {relation.student?.lastName}</div>
                              <div className="text-xs text-gray-500">Studentnr: {relation.student?.studentId}</div>
                            </div>
                          </div>
                        ))}
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
        <DialogContent className="w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M3 12h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m12.1-.7-.7.7m0 11.4.7.7m-12.1-.7-.7.7"></path>
              </svg>
              {newGuardian.id ? 'Voogd Bewerken' : 'Nieuwe Voogd Toevoegen'}
            </DialogTitle>
            <DialogDescription>
              {newGuardian.id 
                ? 'Werk de informatie bij voor deze voogd.' 
                : 'Vul alle benodigde informatie in om een nieuwe voogd toe te voegen.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitGuardian} className="mt-4 space-y-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Persoonlijke Informatie</TabsTrigger>
                <TabsTrigger value="contact">Contactgegevens</TabsTrigger>
                <TabsTrigger value="students">Studenten</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Voornaam <span className="text-[#3b5998]">*</span></Label>
                    <Input 
                      id="firstName"
                      name="firstName"
                      value={newGuardian.firstName || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Achternaam <span className="text-[#3b5998]">*</span></Label>
                    <Input 
                      id="lastName"
                      name="lastName"
                      value={newGuardian.lastName || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship">Relatie tot student <span className="text-[#3b5998]">*</span></Label>
                  <Select 
                    name="relationship" 
                    defaultValue={newGuardian.relationship}
                    onValueChange={(value) => setNewGuardian({...newGuardian, relationship: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer relatie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Ouder</SelectItem>
                      <SelectItem value="guardian">Voogd</SelectItem>
                      <SelectItem value="grandparent">Grootouder</SelectItem>
                      <SelectItem value="other">Anders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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