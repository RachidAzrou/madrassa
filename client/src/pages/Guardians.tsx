import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Download, Eye, Pencil, Trash2, Users, UserCheck, X, UserCircle, Mail, Home, BookOpen, Phone, XCircle, AlertTriangle, MapPin, Briefcase, FileText } from 'lucide-react';
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
  occupation?: string;
};

type StudentType = {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  status?: string;
};

export default function Guardians() {
  const [searchInput, setSearchInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianType | null>(null);
  const [isAddingGuardian, setIsAddingGuardian] = useState(false);
  const [isDeletingGuardian, setIsDeletingGuardian] = useState<GuardianType | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'emergency'>('all');
  const [newGuardian, setNewGuardian] = useState<Partial<GuardianType>>({
    firstName: '',
    lastName: '',
    relationship: 'parent',
    email: '',
    phone: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    isEmergencyContact: false,
    notes: '',
    occupation: '',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // API calls
  const {
    data: guardiansData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['/api/guardians'],
    refetchOnWindowFocus: false,
  });

  const guardians = guardiansData?.guardians || [];
  const totalGuardians = guardians.length;
  const totalPages = Math.ceil(totalGuardians / itemsPerPage);

  const {
    data: guardianStudentsData = [],
    isLoading: guardianStudentsLoading,
  } = useQuery({
    queryKey: ['/api/guardians', selectedGuardian?.id, 'students'],
    enabled: !!selectedGuardian,
  });

  const createGuardianMutation = useMutation({
    mutationFn: (guardian: Partial<GuardianType>) => {
      return apiRequest(`/api/guardians`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(guardian),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      setIsAddingGuardian(false);
      setNewGuardian({
        firstName: '',
        lastName: '',
        relationship: 'parent',
        email: '',
        phone: '',
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        isEmergencyContact: false,
        notes: '',
        occupation: '',
      });
      toast({
        title: 'Succes!',
        description: 'Voogd is succesvol toegevoegd',
        variant: 'success',
      });
    },
    onError: (error) => {
      console.error('Error creating guardian:', error);
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het toevoegen van de voogd',
        variant: 'destructive',
      });
    },
  });

  const updateGuardianMutation = useMutation({
    mutationFn: (guardian: GuardianType) => {
      return apiRequest(`/api/guardians/${guardian.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(guardian),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      setSelectedGuardian(null);
      toast({
        title: 'Succes!',
        description: 'Voogd is succesvol bijgewerkt',
        variant: 'success',
      });
    },
    onError: (error) => {
      console.error('Error updating guardian:', error);
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het bijwerken van de voogd',
        variant: 'destructive',
      });
    },
  });

  const deleteGuardianMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/guardians/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      setIsDeletingGuardian(null);
      toast({
        title: 'Succes!',
        description: 'Voogd is succesvol verwijderd',
        variant: 'success',
      });
    },
    onError: (error) => {
      console.error('Error deleting guardian:', error);
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het verwijderen van de voogd',
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleAddGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    createGuardianMutation.mutate(newGuardian);
  };

  const handleEditGuardian = (guardian: GuardianType) => {
    // Handle edit logic - Open the form with pre-filled values
    console.log("Edit guardian", guardian);
  };

  const handleDeleteGuardian = (guardian: GuardianType) => {
    setIsDeletingGuardian(guardian);
  };

  const handleViewGuardian = (guardian: GuardianType) => {
    setSelectedGuardian(guardian);
  };

  const confirmDelete = () => {
    if (isDeletingGuardian) {
      deleteGuardianMutation.mutate(isDeletingGuardian.id);
    }
  };

  // Filtering and pagination
  const filteredGuardians = guardians.filter((guardian: GuardianType) => {
    const fullName = `${guardian.firstName} ${guardian.lastName}`.toLowerCase();
    const searchTerm = searchInput.toLowerCase();
    
    return fullName.includes(searchTerm) || 
           (guardian.email && guardian.email.toLowerCase().includes(searchTerm)) ||
           (guardian.phone && guardian.phone.toLowerCase().includes(searchTerm));
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedGuardians = filteredGuardians.slice(startIndex, endIndex);

  // Format relationship labels
  const getRelationshipLabel = (relationship: string) => {
    const relationships: { [key: string]: string } = {
      parent: 'Ouder',
      guardian: 'Voogd',
      relative: 'Familielid',
      other: 'Anders',
    };
    
    return relationships[relationship] || relationship;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Voogdenbeheer</h1>
          <p className="text-gray-500 mt-1">Beheer alle voogden en hun relaties met studenten</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Zoek voogden..."
              className="pl-8 w-full sm:w-[250px]"
              value={searchInput}
              onChange={handleSearchChange}
            />
          </div>
          <Button 
            className="flex items-center gap-2 bg-primary" 
            onClick={() => setIsAddingGuardian(true)}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Voogd Toevoegen</span>
          </Button>
        </div>
      </div>
      
      {/* Filtering options */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'all' | 'emergency')} className="w-auto">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-white">Alle voogden</TabsTrigger>
            <TabsTrigger value="emergency" className="data-[state=active]:bg-white">Noodcontacten</TabsTrigger>
          </TabsList>
        </Tabs>
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
                        <div className="flex-shrink-0 h-10 w-10">
                          <Avatar>
                            <AvatarFallback className="text-white bg-[#1e3a8a]">
                              {guardian.firstName.charAt(0)}
                              {guardian.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{guardian.firstName} {guardian.lastName}</div>
                          <div className="text-sm text-gray-500">{guardian.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getRelationshipLabel(guardian.relationship)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {guardian.isEmergencyContact ? (
                        <Badge variant="destructive">Noodcontact</Badge>
                      ) : (
                        <Badge variant="outline">Standaard</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => handleViewGuardian(guardian)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 hover:text-amber-800"
                          onClick={() => handleEditGuardian(guardian)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteGuardian(guardian)}
                        >
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
        {!isLoading && !isError && guardians.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Vorige
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Volgende
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{startIndex + 1}</span>
                  {' '}-{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredGuardians.length)}</span>
                  {' '}van{' '}
                  <span className="font-medium">{filteredGuardians.length}</span>
                  {' '}voogden
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Vorige</span>
                    &larr;
                  </button>
                  
                  {/* Show current page and total pages */}
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Pagina {currentPage} van {totalPages}
                  </span>
                  
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
            <div className="mt-6 space-y-8">
              {/* Profielkaart */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  <div className="flex flex-col items-center text-center p-6 border rounded-md bg-white shadow-sm">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarFallback className="bg-[#1e3a8a] text-white text-2xl">
                        {selectedGuardian.firstName ? selectedGuardian.firstName.charAt(0) : ''}{selectedGuardian.lastName ? selectedGuardian.lastName.charAt(0) : ''}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold">{selectedGuardian.firstName} {selectedGuardian.lastName}</h2>
                    <p className="text-gray-500 mb-2">{getRelationshipLabel(selectedGuardian.relationship)}</p>
                    {selectedGuardian.isEmergencyContact && (
                      <Badge variant="destructive" className="mt-1">Noodcontact</Badge>
                    )}
                  </div>
                </div>
                
                <div className="w-full md:w-2/3">
                  {/* Contact informatie */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        <Label className="text-sm font-medium text-gray-700">Email</Label>
                      </div>
                      <div className="p-3 border rounded-md bg-gray-50">
                        {selectedGuardian.email || 'Niet ingevuld'}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        <Label className="text-sm font-medium text-gray-700">Telefoonnummer</Label>
                      </div>
                      <div className="p-3 border rounded-md bg-gray-50">
                        {selectedGuardian.phone || 'Niet ingevuld'}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-primary" />
                        <Label className="text-sm font-medium text-gray-700">Adres</Label>
                      </div>
                      <div className="p-3 border rounded-md bg-gray-50">
                        {selectedGuardian.street && selectedGuardian.houseNumber ? 
                          `${selectedGuardian.street} ${selectedGuardian.houseNumber}` : 
                          'Niet ingevuld'
                        }
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <Label className="text-sm font-medium text-gray-700">Plaats</Label>
                      </div>
                      <div className="p-3 border rounded-md bg-gray-50">
                        {selectedGuardian.postalCode && selectedGuardian.city ? 
                          `${selectedGuardian.postalCode} ${selectedGuardian.city}` : 
                          'Niet ingevuld'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Extra informatie */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-primary" />
                    <Label className="text-sm font-medium text-gray-700">Relatie</Label>
                  </div>
                  <div className="p-3 border rounded-md bg-gray-50">
                    {getRelationshipLabel(selectedGuardian.relationship)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <Label className="text-sm font-medium text-gray-700">Beroep</Label>
                  </div>
                  <div className="p-3 border rounded-md bg-gray-50">
                    {selectedGuardian.occupation || 'Niet ingevuld'}
                  </div>
                </div>
              </div>
              
              {/* Noodcontact info als van toepassing */}
              {selectedGuardian.isEmergencyContact && (
                <div className="p-5 border-l-4 border-red-600 bg-red-50 rounded-r-lg shadow-sm">
                  <div className="flex items-center mb-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100 mr-3">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-red-800">Noodcontact</h3>
                  </div>
                  
                  <p className="text-sm text-red-700 mb-3 ml-11">
                    Dit contact is aangeduid als noodcontact voor de onderstaande studenten en kan gecontacteerd worden in noodgevallen.
                  </p>
                </div>
              )}
              
              {/* Notities */}
              {selectedGuardian.notes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <Label className="text-sm font-medium text-gray-700">
                      Notities
                    </Label>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md min-h-[100px] border border-gray-200 text-sm">
                    {selectedGuardian.notes}
                  </div>
                </div>
              )}
              
              {/* Toegewezen studenten */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Toegewezen studenten</h3>
                  </div>
                  {guardianStudentsData && guardianStudentsData.length > 0 && (
                    <Badge variant={selectedGuardian.isEmergencyContact ? "destructive" : "outline"} className="ml-2">
                      {guardianStudentsData.length} {guardianStudentsData.length === 1 ? 'student' : 'studenten'}
                    </Badge>
                  )}
                </div>
                
                {guardianStudentsLoading ? (
                  <div className="flex justify-center my-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : guardianStudentsData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                    <Users className="h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-500 mb-1">Geen studenten gekoppeld</h3>
                    <p className="text-sm text-gray-400">Deze voogd heeft nog geen gekoppelde studenten</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {guardianStudentsData.map((relation: any) => {
                      return (
                        <div
                          key={relation.id}
                          className="flex items-center p-4 bg-white hover:bg-gray-50 border rounded-lg shadow-sm"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-[#1e3a8a] text-white text-lg">
                              {relation.student?.firstName?.[0] || '?'}{relation.student?.lastName?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4 flex-1">
                            {relation.student ? (
                              <>
                                <div className="text-md font-medium">{relation.student.firstName} {relation.student.lastName}</div>
                                <div className="text-sm text-gray-500 flex items-center flex-wrap gap-2">
                                  <span>#{relation.student.studentId}</span>
                                  {relation.isPrimary && (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                      Primair contact
                                    </Badge>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-gray-500">Student #{relation.studentId}</div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-blue-600"
                            onClick={() => {
                              // Implementatie voor wanneer de knop wordt geklikt
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
      
      {/* Voogd toevoegen dialoog */}
      <Dialog open={isAddingGuardian} onOpenChange={() => setIsAddingGuardian(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Voogd Toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe voogd toe aan het systeem
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddGuardian} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Voornaam *</Label>
                <Input 
                  id="firstName" 
                  value={newGuardian.firstName} 
                  onChange={e => setNewGuardian({...newGuardian, firstName: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Achternaam *</Label>
                <Input 
                  id="lastName" 
                  value={newGuardian.lastName} 
                  onChange={e => setNewGuardian({...newGuardian, lastName: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={newGuardian.email} 
                  onChange={e => setNewGuardian({...newGuardian, email: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefoonnummer</Label>
                <Input 
                  id="phone" 
                  value={newGuardian.phone} 
                  onChange={e => setNewGuardian({...newGuardian, phone: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="relationship">Relatie *</Label>
                <Select 
                  value={newGuardian.relationship} 
                  onValueChange={value => setNewGuardian({...newGuardian, relationship: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer relatie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Ouder</SelectItem>
                    <SelectItem value="guardian">Voogd</SelectItem>
                    <SelectItem value="relative">Familielid</SelectItem>
                    <SelectItem value="other">Anders</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="occupation">Beroep</Label>
                <Input 
                  id="occupation" 
                  value={newGuardian.occupation} 
                  onChange={e => setNewGuardian({...newGuardian, occupation: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="street">Straat</Label>
                <Input 
                  id="street" 
                  value={newGuardian.street} 
                  onChange={e => setNewGuardian({...newGuardian, street: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="houseNumber">Huisnummer</Label>
                <Input 
                  id="houseNumber" 
                  value={newGuardian.houseNumber} 
                  onChange={e => setNewGuardian({...newGuardian, houseNumber: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postcode</Label>
                <Input 
                  id="postalCode" 
                  value={newGuardian.postalCode} 
                  onChange={e => setNewGuardian({...newGuardian, postalCode: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Plaats</Label>
                <Input 
                  id="city" 
                  value={newGuardian.city} 
                  onChange={e => setNewGuardian({...newGuardian, city: e.target.value})}
                />
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Notities</Label>
                <Textarea 
                  id="notes" 
                  value={newGuardian.notes} 
                  onChange={e => setNewGuardian({...newGuardian, notes: e.target.value})}
                  rows={4}
                />
              </div>
              
              <div className="col-span-2 flex items-center gap-2">
                <Checkbox 
                  id="isEmergencyContact"
                  checked={newGuardian.isEmergencyContact} 
                  onCheckedChange={(checked) => 
                    setNewGuardian({...newGuardian, isEmergencyContact: checked as boolean})
                  }
                />
                <Label htmlFor="isEmergencyContact" className="cursor-pointer">
                  Dit is een noodcontact (kan worden gebeld in geval van nood)
                </Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddingGuardian(false)}
              >
                Annuleren
              </Button>
              <Button type="submit">
                Voogd Toevoegen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Verwijder bevestiging dialoog */}
      <Dialog open={!!isDeletingGuardian} onOpenChange={() => setIsDeletingGuardian(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Voogd Verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze voogd wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          
          {isDeletingGuardian && (
            <div className="my-4 p-4 border rounded-md bg-red-50 flex items-start gap-3">
              <div className="mt-1">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">
                  Je staat op het punt om de volgende voogd te verwijderen:
                </p>
                <p className="text-sm mt-1 text-red-700">
                  {isDeletingGuardian.firstName} {isDeletingGuardian.lastName} ({getRelationshipLabel(isDeletingGuardian.relationship)})
                </p>
                <p className="text-xs mt-2 text-red-600">
                  Let op: Als er studenten aan deze voogd zijn gekoppeld, zullen deze relaties ook worden verwijderd.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeletingGuardian(null)}
            >
              Annuleren
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
            >
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}