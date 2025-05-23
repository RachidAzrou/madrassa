import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Download, Eye, Pencil, Trash2, Users, UserCheck, X, UserCircle, Mail, Home, BookOpen, Phone, XCircle, AlertTriangle } from 'lucide-react';
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
  
  // Render
  return (
    <div className="container px-4 md:px-6 max-w-7xl">
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between py-6 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voogdenbeheer</h1>
          <p className="text-muted-foreground mt-1">
            Beheer voogden, noodcontacten en hun relaties met studenten
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Zoek voogden..."
              className="pl-9 w-full md:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleAddNewGuardian}
            className="bg-primary hover:bg-primary/90 text-white gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Nieuwe Voogd
          </Button>
        </div>
      </div>
      
      <div className="py-6">
        {searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
              <UserCircle className="h-10 w-10 text-primary opacity-70" />
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
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left font-medium">Voogd</th>
                    <th className="py-3 px-4 text-left font-medium">Relatie</th>
                    <th className="py-3 px-4 text-left font-medium">Status</th>
                    <th className="py-3 px-4 text-right">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((guardian: any) => (
                    <tr 
                      key={guardian.id} 
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-white">
                              {guardian.firstName ? guardian.firstName.charAt(0) : ''}
                              {guardian.lastName ? guardian.lastName.charAt(0) : ''}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{guardian.firstName} {guardian.lastName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{getRelationshipLabel(guardian.relationship)}</div>
                      </td>
                      <td className="py-3 px-4">
                        {guardian.isEmergencyContact && (
                          <Badge variant="destructive">Noodcontact</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleShowGuardianDetails(guardian)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditGuardian(guardian)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              // Hier zou een verwijderfunctie komen
                              toast({
                                title: "Functie niet beschikbaar",
                                description: "Het verwijderen van voogden is momenteel niet beschikbaar.",
                                variant: "destructive"
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
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

          {/* Noodcontact waarschuwing - bovenaan als deze persoon een noodcontact is */}
          {selectedGuardian?.isEmergencyContact && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-semibold text-lg">Noodcontact</h3>
              </div>
              <p className="text-sm text-red-600">
                Deze persoon is gemarkeerd als noodcontact. In geval van nood zal deze persoon gecontacteerd worden.
              </p>
            </div>
          )}

          {/* Gegevens in tabelvorm voor duidelijk overzicht */}
          <div className="bg-white rounded-lg border shadow-sm mb-6">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold flex items-center text-primary">
                <UserCircle className="h-5 w-5 mr-2" />
                Persoonlijke informatie
              </h3>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Naam</p>
                  <p className="font-medium">{selectedGuardian?.firstName} {selectedGuardian?.lastName}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Relatie tot student</p>
                  <p className="font-medium">{selectedGuardian && getRelationshipLabel(selectedGuardian.relationship)}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Beroep</p>
                  <p className="font-medium">{selectedGuardian?.occupation || '-'}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">E-mail</p>
                  <p className="font-medium flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    {selectedGuardian?.email || '-'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Telefoon</p>
                  <p className="font-medium flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-500" />
                    {selectedGuardian?.phone || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Adres informatie in eigen sectie */}
          {(selectedGuardian?.street || selectedGuardian?.city) && (
            <div className="bg-white rounded-lg border shadow-sm mb-6">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold flex items-center text-primary">
                  <Home className="h-5 w-5 mr-2" />
                  Adres
                </h3>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Straat en huisnummer</p>
                    <p className="font-medium">
                      {selectedGuardian?.street || '-'} {selectedGuardian?.houseNumber || ''}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Postcode en stad</p>
                    <p className="font-medium">
                      {selectedGuardian?.postalCode || '-'} {selectedGuardian?.city || ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Gekoppelde studenten in eigen sectie */}
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold flex items-center text-primary">
                <Users className="h-5 w-5 mr-2" />
                Gekoppelde Studenten
              </h3>
            </div>
            
            <div className="p-4">
              {guardianStudentsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2">Laden...</span>
                </div>
              ) : (
                <>
                  {guardianStudentsData && Array.isArray(guardianStudentsData) && guardianStudentsData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {guardianStudentsData.map((relation) => (
                        <div 
                          key={relation.id} 
                          className="flex items-center justify-between p-3 rounded-md border border-gray-200 hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {relation.student?.firstName?.charAt(0) || ''}
                                {relation.student?.lastName?.charAt(0) || ''}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{relation.student?.firstName} {relation.student?.lastName}</p>
                              <p className="text-xs text-gray-500">{relation.student?.studentId}</p>
                            </div>
                          </div>
                          
                          {relation.isPrimary && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                              Primair
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed rounded-md bg-gray-50">
                      <Users className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Geen studenten gekoppeld aan deze voogd.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Notities onderaan indien aanwezig */}
          {selectedGuardian?.notes && (
            <div className="mt-6 bg-white rounded-lg border shadow-sm">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold flex items-center text-primary">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Notities
                </h3>
              </div>
              <div className="p-4">
                <p className="bg-gray-50 p-3 rounded-md border text-gray-700">{selectedGuardian?.notes}</p>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-6 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setSelectedGuardian(null)}
            >
              Sluiten
            </Button>
            <Button
              onClick={() => {
                setNewGuardian(selectedGuardian);
                setSelectedGuardian(null);
                setShowAddDialog(true);
              }}
            >
              Bewerken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Toevoegen/bewerken dialoog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {newGuardian.id ? 'Voogd Bewerken' : 'Nieuwe Voogd Toevoegen'}
            </DialogTitle>
            <DialogDescription>
              {newGuardian.id 
                ? 'Bewerk de gegevens van deze voogd.'
                : 'Voer de gegevens in van de nieuwe voogd.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitGuardian}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
              <div className="col-span-1 md:col-span-2 space-y-6">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-4">Persoonlijke Informatie</h3>
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
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
                      <Label htmlFor="phone">Telefoon</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={newGuardian.phone || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="relationship">Relatie tot student</Label>
                      <Select
                        name="relationship"
                        value={newGuardian.relationship}
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="occupation">Beroep</Label>
                      <Input
                        id="occupation"
                        name="occupation"
                        value={newGuardian.occupation || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-4">Adres</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="street">Straat</Label>
                      <Input
                        id="street"
                        name="street"
                        value={newGuardian.street || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                    
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
                      <Label htmlFor="city">Stad</Label>
                      <Input
                        id="city"
                        name="city"
                        value={newGuardian.city || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2">
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
                      className="font-medium text-red-600"
                    >
                      Dit is een noodcontact
                    </Label>
                  </div>
                  {newGuardian.isEmergencyContact && (
                    <p className="text-sm text-gray-500 mt-2">
                      Deze persoon zal gecontacteerd worden in geval van nood.
                    </p>
                  )}
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-4">Notities</h3>
                  <div className="space-y-2">
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Extra informatie over deze voogd..."
                      value={newGuardian.notes || ''}
                      onChange={handleInputChange}
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </div>
              
              {!newGuardian.id && (
                <div className="col-span-1 border rounded-lg p-4">
                  <h3 className="font-medium mb-4">Koppel Studenten</h3>
                  
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="studentSearch">Zoek student</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        id="studentSearch"
                        placeholder="Zoek op naam of ID..."
                        className="pl-9"
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
                      <h4 className="font-medium mb-2">Geselecteerde studenten:</h4>
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
                                <Checkbox
                                  id={`primary-${id}`}
                                  checked={primaryStudentId === id}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setPrimaryStudentId(id);
                                    } else if (primaryStudentId === id) {
                                      setPrimaryStudentId(null);
                                    }
                                  }}
                                />
                                <Label htmlFor={`primary-${id}`} className="text-xs">Primair</Label>
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
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddDialog(false)}
              >
                Annuleren
              </Button>
              <Button type="submit">
                {newGuardian.id ? 'Opslaan' : 'Toevoegen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}