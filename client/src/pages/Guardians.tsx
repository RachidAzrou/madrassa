import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Download, Eye, Pencil, Trash2, Users } from 'lucide-react';
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
    isLoading: isLoadingAllStudents,
  } = useQuery({
    queryKey: ['/api/students'],
  });

  // Fetch associated students for selected guardian
  const {
    data: guardianStudentsData = [],
    isLoading: isLoadingStudents,
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
  
  // Add Guardian mutation
  const addGuardianMutation = useMutation({
    mutationFn: async (data: { guardian: Partial<GuardianType>, studentIds: number[] }) => {
      // First create the guardian
      const guardian = await apiRequest('POST', '/api/guardians', data.guardian);
      
      // Then assign students if any were selected
      if (data.studentIds.length > 0 && guardian.id) {
        const studentGuardianPromises = data.studentIds.map(studentId => 
          apiRequest('POST', '/api/student-guardians', {
            studentId,
            guardianId: guardian.id
          })
        );
        await Promise.all(studentGuardianPromises);
      }
      
      return guardian;
    },
    onSuccess: () => {
      toast({
        title: "Voogd toegevoegd",
        description: "De voogd is succesvol toegevoegd met de geselecteerde studenten",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      setShowAddDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van de voogd",
        variant: "destructive",
      });
      console.error('Add error:', error);
    },
  });
  
  // Handle form submission
  const handleSubmitGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    addGuardianMutation.mutate({
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
    // Implement edit guardian functionality
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
                guardians.map((guardian: GuardianType) => (
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
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Voogd
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewGuardian(guardian)}
                          title="Details bekijken"
                          className="h-8 w-8 p-0 text-sky-700 hover:text-sky-900 hover:bg-sky-50"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Bekijken</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditGuardian(guardian)}
                          title="Voogd bewerken"
                          className="h-8 w-8 p-0 text-sky-700 hover:text-sky-900 hover:bg-sky-50"
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Bewerken</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteGuardian(guardian)}
                          title="Voogd verwijderen"
                        >
                          <Trash2 className="h-4 w-4" />
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
      
      {/* Add Guardian Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="w-[95vw] max-w-4xl h-[85vh] max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M3 12h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m12.1-.7-.7.7m0 11.4.7.7m-12.1-.7-.7.7"></path>
              </svg>
              Nieuwe Voogd Toevoegen
            </DialogTitle>
            <DialogDescription>
              Vul alle benodigde informatie in om een nieuwe voogd toe te voegen.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitGuardian} className="mt-4 space-y-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="personal">Persoonlijke Informatie</TabsTrigger>
                <TabsTrigger value="contact">Contactgegevens</TabsTrigger>
                <TabsTrigger value="students">Studenten</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Voornaam</Label>
                    <Input 
                      id="firstName"
                      name="firstName"
                      value={newGuardian.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Achternaam</Label>
                    <Input 
                      id="lastName"
                      name="lastName"
                      value={newGuardian.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship">Relatie tot student</Label>
                  <Select 
                    name="relationship" 
                    defaultValue={newGuardian.relationship}
                    onValueChange={(value) => setNewGuardian({...newGuardian, relationship: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer relatie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Ouder</SelectItem>
                      <SelectItem value="guardian">Voogd</SelectItem>
                      <SelectItem value="grandparent">Grootouder</SelectItem>
                      <SelectItem value="sibling">Broer/Zus</SelectItem>
                      <SelectItem value="other">Anders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  <Checkbox 
                    id="isEmergencyContact" 
                    name="isEmergencyContact"
                    checked={newGuardian.isEmergencyContact}
                    onCheckedChange={(checked) => 
                      setNewGuardian({...newGuardian, isEmergencyContact: !!checked})
                    }
                  />
                  <Label htmlFor="isEmergencyContact" className="text-sm font-medium leading-none cursor-pointer">
                    Dit is een noodcontact
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notities</Label>
                  <textarea 
                    id="notes"
                    name="notes"
                    className="w-full min-h-[100px] p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={newGuardian.notes || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mailadres</Label>
                    <Input 
                      id="email"
                      name="email"
                      type="email"
                      value={newGuardian.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefoonnummer</Label>
                    <Input 
                      id="phone"
                      name="phone"
                      value={newGuardian.phone || ''}
                      onChange={handleInputChange}
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
              
              <TabsContent value="students" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-md font-medium mb-2">Studenten toewijzen</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Selecteer de studenten die aan deze voogd moeten worden toegewezen.
                  </p>
                  
                  {isLoadingAllStudents ? (
                    <div className="flex justify-center my-4">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : allStudents.length === 0 ? (
                    <div className="text-center p-4 bg-gray-50 rounded-md">
                      <p className="text-gray-500">Geen studenten gevonden.</p>
                    </div>
                  ) : (
                    <div className="border rounded-md divide-y">
                      {allStudents.map((student: StudentType) => (
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
                            <label 
                              htmlFor={`student-${student.id}`}
                              className="ml-3 flex items-center cursor-pointer"
                            >
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarFallback className="bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700 text-xs">
                                  {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-medium">{student.firstName} {student.lastName}</div>
                                <div className="text-xs text-gray-500">Studentnr: {student.studentId}</div>
                              </div>
                            </label>
                          </div>
                          <Badge variant="outline" className="bg-gray-100">
                            {student.status || "Actief"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
              >
                Annuleren
              </Button>
              <Button 
                type="submit" 
                className="bg-[#3b5998] hover:bg-[#2d4373]" 
                disabled={addGuardianMutation.isPending}
              >
                {addGuardianMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Bezig met opslaan...
                  </>
                ) : (
                  'Voogd Toevoegen'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white mt-4 px-4 py-3 flex items-center justify-between border border-gray-200 rounded-lg sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Tonen <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> tot <span className="font-medium">{Math.min(currentPage * 10, totalGuardians)}</span> van <span className="font-medium">{totalGuardians}</span> resultaten
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginering">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Vorige</span>
                  &larr;
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
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
        </div>
      )}
      
      {/* Voogd details dialoog */}
      <Dialog open={!!selectedGuardian} onOpenChange={() => setSelectedGuardian(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {selectedGuardian && `${selectedGuardian.firstName} ${selectedGuardian.lastName}`}
            </DialogTitle>
            <DialogDescription>
              Details en beheer van voogdinformatie
            </DialogDescription>
          </DialogHeader>
          
          {selectedGuardian && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium mb-2">Persoonlijke Informatie</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="w-32 text-sm text-gray-500">Naam:</span>
                    <span>{selectedGuardian.firstName} {selectedGuardian.lastName}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 text-sm text-gray-500">Email:</span>
                    <span>{selectedGuardian.email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 text-sm text-gray-500">Telefoon:</span>
                    <span>{selectedGuardian.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 text-sm text-gray-500">Relatie:</span>
                    <span>{getRelationshipLabel(selectedGuardian.relationship)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 text-sm text-gray-500">Status:</span>
                    {selectedGuardian.isEmergencyContact ? (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        Noodcontact
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        Voogd
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">Adresgegevens</h3>
                <div className="space-y-2">
                  {selectedGuardian.street ? (
                    <div className="flex items-center">
                      <span className="w-32 text-sm text-gray-500">Straat:</span>
                      <span>{selectedGuardian.street} {selectedGuardian.houseNumber || ''}</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="w-32 text-sm text-gray-500">Adres:</span>
                      <span>{selectedGuardian.address || 'Niet beschikbaar'}</span>
                    </div>
                  )}
                  {selectedGuardian.postalCode && (
                    <div className="flex items-center">
                      <span className="w-32 text-sm text-gray-500">Postcode:</span>
                      <span>{selectedGuardian.postalCode}</span>
                    </div>
                  )}
                  {selectedGuardian.city && (
                    <div className="flex items-center">
                      <span className="w-32 text-sm text-gray-500">Plaats:</span>
                      <span>{selectedGuardian.city}</span>
                    </div>
                  )}
                </div>
                
                {selectedGuardian.notes && (
                  <div className="mt-6">
                    <h3 className="text-md font-medium mb-2">Notities</h3>
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
                      {selectedGuardian.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {selectedGuardian && (
            <div className="mt-6">
              <h3 className="text-md font-medium mb-3">Verbonden Studenten</h3>
              
              {isLoadingStudents ? (
                <div className="flex justify-center my-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : guardianStudentsData.length === 0 ? (
                <div className="text-center p-6 bg-gray-50 rounded-md text-gray-500">
                  Deze voogd heeft geen verbonden studenten
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
                          {relation.student?.firstName.charAt(0)}{relation.student?.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3">
                        <div className="text-sm font-medium">{relation.student?.firstName} {relation.student?.lastName}</div>
                        <div className="text-xs text-gray-500">Studentnr: {relation.student?.studentId}</div>
                      </div>
                      <Badge variant="outline" className={`ml-auto ${relation.isPrimary ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                        {relation.isPrimary ? 'Primair' : 'Secundair'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
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
    </div>
  );
}