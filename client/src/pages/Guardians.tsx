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
    <div className="container p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voogden</h1>
          <p className="text-gray-500 mt-1">
            Beheer voogden en hun relaties met studenten
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Zoek voogden..."
              className="pl-9 w-full sm:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleAddNewGuardian}
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Nieuwe Voogd
          </Button>
        </div>
      </div>
      
      {searchResults.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 rounded-md">
          <UserCircle className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Geen voogden gevonden</h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery.trim() !== '' 
              ? 'Geen voogden gevonden die overeenkomen met je zoekopdracht. Probeer een andere zoekterm.' 
              : 'Er zijn nog geen voogden toegevoegd. Klik op de knop "Nieuwe Voogd" om een voogd toe te voegen.'}
          </p>
          {searchQuery && (
            <Button 
              variant="outline"
              className="mt-4" 
              onClick={() => setSearchQuery('')}
            >
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
                  <th className="py-3 px-4 text-left font-medium">Contact</th>
                  <th className="py-3 px-4 text-left font-medium">Relatie</th>
                  <th className="py-3 px-4 text-left font-medium">Status</th>
                  <th className="py-3 px-4 text-right"></th>
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
                      <div className="space-y-1">
                        <div className="flex items-center text-gray-700">
                          <Mail className="h-4 w-4 mr-2 text-gray-500" />
                          {guardian.email || '-'}
                        </div>
                        <div className="flex items-center text-gray-700">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          {guardian.phone || '-'}
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
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600"
                          onClick={() => handleShowGuardianDetails(guardian)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600"
                          onClick={() => handleEditGuardian(guardian)}
                        >
                          <Pencil className="h-4 w-4" />
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
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="personal" className="flex gap-2 items-center">
                    <UserCircle className="h-4 w-4" />
                    Persoonlijk
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="flex gap-2 items-center">
                    <Mail className="h-4 w-4" />
                    Contact
                  </TabsTrigger>
                  <TabsTrigger value="students" className="flex gap-2 items-center">
                    <Users className="h-4 w-4" />
                    Studenten
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal" className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3 space-y-5">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Relatie
                          </Label>
                          <div className="p-3 border rounded-md bg-gray-50">
                            {getRelationshipLabel(selectedGuardian.relationship)}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Beroep
                          </Label>
                          <div className="p-3 border rounded-md bg-gray-50">
                            {selectedGuardian.occupation || 'Niet ingevuld'}
                          </div>
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Adres
                          </Label>
                          <div className="p-3 border rounded-md bg-gray-50">
                            {selectedGuardian.street} {selectedGuardian.houseNumber}, {selectedGuardian.postalCode} {selectedGuardian.city}
                          </div>
                        </div>
                        
                        {selectedGuardian.notes && (
                          <div className="md:col-span-2 space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                              Notities
                            </Label>
                            <div className="p-3 bg-gray-50 rounded-md min-h-[100px] border border-gray-200 text-sm">
                              {selectedGuardian.notes}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="contact" className="space-y-4 pt-4">
                  <div className="bg-white border rounded-lg p-6 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
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
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Home className="h-5 w-5 text-primary" />
                            <Label className="text-sm font-medium text-gray-700">Adres</Label>
                          </div>
                          <div className="p-3 border rounded-md bg-gray-50">
                            {selectedGuardian.street} {selectedGuardian.houseNumber}, {selectedGuardian.postalCode} {selectedGuardian.city}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="students" className="space-y-6 pt-4">
                  {selectedGuardian.isEmergencyContact && (
                    <div className="mb-6 p-5 border-l-4 border-red-600 bg-red-50 rounded-r-lg shadow-sm">
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
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Toegewezen studenten</h3>
                        <Badge variant={selectedGuardian.isEmergencyContact ? "destructive" : "outline"} className="ml-2">
                          {guardianStudentsData.length} {guardianStudentsData.length === 1 ? 'student' : 'studenten'}
                        </Badge>
                      </div>
                      
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
                                    <div className="text-sm text-gray-500 flex items-center">
                                      <span className="mr-3">#{relation.student.studentId}</span>
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
                                  // Implementation for when the button is clicked
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
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
                <div className="bg-blue-50 p-4 rounded-md mb-6">
                  <div className="flex items-center mb-2">
                    <Users className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-blue-700 font-medium">Studenten koppelen</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    Koppel één of meerdere studenten aan deze voogd. Selecteer ook welke student de primaire student is voor deze voogd.
                  </p>
                </div>
                
                {newGuardian.id ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">
                      Je kunt studenten koppelen via de 'Studenten' pagina nadat je de voogd hebt opgeslagen.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Zoek studenten</Label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          type="search"
                          placeholder="Zoek op naam of studentnummer..."
                          className="pl-9"
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      <Label>Beschikbare studenten</Label>
                      {filteredStudentIds.length === 0 ? (
                        <div className="text-center p-4 bg-gray-50 rounded-md text-gray-500">
                          Geen beschikbare studenten gevonden
                        </div>
                      ) : (
                        <div className="max-h-[200px] overflow-y-auto border rounded-md">
                          {filteredStudentIds.map((studentId) => {
                            const student = studentsData.find((s: any) => s.id === studentId);
                            if (!student) return null;
                            
                            return (
                              <div 
                                key={studentId}
                                className="flex items-center p-3 hover:bg-gray-50 border-b last:border-0 cursor-pointer"
                                onClick={() => {
                                  setSelectedStudentIds([...selectedStudentIds, studentId]);
                                  if (!primaryStudentId) setPrimaryStudentId(studentId);
                                }}
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{student.firstName} {student.lastName}</div>
                                  <div className="text-sm text-gray-500">#{student.studentId}</div>
                                </div>
                                <Button 
                                  type="button"
                                  variant="outline" 
                                  size="sm"
                                >
                                  <UserCheck className="h-4 w-4 mr-1" />
                                  Toevoegen
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center justify-between">
                        <Label>Geselecteerde studenten</Label>
                        {selectedStudentIds.length > 0 && (
                          <Badge variant="outline">
                            {selectedStudentIds.length} {selectedStudentIds.length === 1 ? 'student' : 'studenten'}
                          </Badge>
                        )}
                      </div>
                      
                      {selectedStudentIds.length === 0 ? (
                        <div className="text-center p-4 bg-gray-50 rounded-md text-gray-500">
                          Nog geen studenten geselecteerd
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {selectedStudentIds.map((studentId) => {
                            const student = studentsData.find((s: any) => s.id === studentId);
                            if (!student) return null;
                            
                            const isPrimary = primaryStudentId === studentId;
                            
                            return (
                              <div 
                                key={studentId}
                                className={`flex items-center p-3 rounded-md border ${isPrimary ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{student.firstName} {student.lastName}</div>
                                  <div className="text-sm text-gray-500 flex items-center">
                                    <span className="mr-3">#{student.studentId}</span>
                                    {isPrimary && (
                                      <Badge variant="outline" className="bg-blue-100 border-blue-200 text-blue-700">
                                        Primair contact
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {!isPrimary && (
                                    <Button 
                                      type="button"
                                      variant="outline" 
                                      size="sm"
                                      className="text-blue-600"
                                      onClick={() => setPrimaryStudentId(studentId)}
                                    >
                                      Primair maken
                                    </Button>
                                  )}
                                  
                                  <Button 
                                    type="button"
                                    variant="ghost" 
                                    size="sm"
                                    className="text-red-600"
                                    onClick={() => {
                                      setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
                                      if (primaryStudentId === studentId) {
                                        setPrimaryStudentId(selectedStudentIds.find(id => id !== studentId) || null);
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
                      )}
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="pt-4 border-t border-gray-200">
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
                disabled={createGuardianMutation.isPending || updateGuardianMutation.isPending}
              >
                {createGuardianMutation.isPending || updateGuardianMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Bezig...
                  </>
                ) : (
                  newGuardian.id ? 'Bijwerken' : 'Toevoegen'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}