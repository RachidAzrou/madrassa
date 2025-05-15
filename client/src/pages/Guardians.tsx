import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
// We definiëren hier een Guardian type voor lokaal gebruik
type GuardianType = {
  id: number;
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  phone: string;
  address: string | null;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  city: string | null;
  occupation: string | null;
  isEmergencyContact: boolean;
  notes: string | null;
};
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Guardian {
  id: number;
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  phone: string;
  address: string | null;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  city: string | null;
  occupation: string | null;
  isEmergencyContact: boolean;
  notes: string | null;
}

export default function Guardians() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [relation, setRelation] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // State voor guardian dialogen
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianType | null>(null);
  const [guardianFormData, setGuardianFormData] = useState({
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
    notes: '',
    studentIds: [] as number[]
  });
  
  // State voor studentenzoekopdracht
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isStudentSearchDialogOpen, setIsStudentSearchDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Array<{id: number, name: string}>>([]);
  
  // State voor voogddetails dialog
  const [isViewGuardianDialogOpen, setIsViewGuardianDialogOpen] = useState(false);

  // Fetch guardians with filters
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/guardians', { searchTerm, relation, page: currentPage }],
    staleTime: 5000, // Verlaagd naar 5 seconden voor snellere updates
  });
  
  // Studenten zoeken
  const { data: studentSearchData, isLoading: isSearchingStudents } = useQuery({
    queryKey: ['/api/students', { searchTerm: studentSearchTerm }],
    staleTime: 30000,
    enabled: isStudentSearchDialogOpen && studentSearchTerm.length > 0,
  });

  // We gaan direct werken met de data array
  const totalPages = Array.isArray(data) ? Math.ceil(data.length / 10) : 0; // Assuming 10 guardians per page

  // Mutatie om een voogd toe te voegen
  // Mutatie voor student-guardian koppelingen
  const createStudentGuardianMutation = useMutation({
    mutationFn: async (data: { studentId: number; guardianId: number; isPrimary: boolean }) => {
      console.log("Creating student-guardian relation:", data);
      return apiRequest('POST', '/api/student-guardians', data);
    },
    onError: (error) => {
      console.error("Error in createStudentGuardianMutation:", error);
    }
  });
  
  const createGuardianMutation = useMutation({
    mutationFn: async (guardianData: typeof guardianFormData) => {
      // We verwijderen studentIds omdat deze niet in het guardians schema staan
      const { studentIds, ...guardianInfo } = guardianData;
      return apiRequest('POST', '/api/guardians', guardianInfo);
    },
    onSuccess: async (newGuardian) => {
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      
      // Maak de student-guardian koppelingen aan
      if (guardianFormData.studentIds.length > 0) {
        const createPromises = guardianFormData.studentIds.map(studentId => 
          createStudentGuardianMutation.mutateAsync({
            studentId,
            guardianId: newGuardian.id,
            isPrimary: false
          })
        );
        
        try {
          await Promise.all(createPromises);
          queryClient.invalidateQueries({ queryKey: ['/api/student-guardians'] });
        } catch (error) {
          console.error("Fout bij koppelen van studenten:", error);
          toast({
            title: "Let op",
            description: "Voogd is aangemaakt maar er was een probleem bij het koppelen van studenten.",
            variant: "destructive",
          });
        }
      }
      
      // Reset form and close dialog
      setGuardianFormData({
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
        notes: '',
        studentIds: []
      });
      setSelectedStudents([]);
      setIsAddDialogOpen(false);
      
      // Toon succes melding
      toast({
        title: "Voogd toegevoegd",
        description: "De voogd is succesvol toegevoegd aan het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de voogd.",
        variant: "destructive",
      });
    }
  });
  
  // Mutatie voor het bijwerken van een voogd
  const updateGuardianMutation = useMutation({
    mutationFn: async (data: { id: number; guardianData: typeof guardianFormData }) => {
      // We verwijderen studentIds omdat deze niet in het guardians schema staan
      const { studentIds, ...guardianInfo } = data.guardianData;
      return apiRequest('PUT', `/api/guardians/${data.id}`, guardianInfo);
    },
    onSuccess: async (updatedGuardian, variables) => {
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      
      // Eerst query invalideren om ervoor te zorgen dat we met de nieuwste info werken
      queryClient.invalidateQueries({ queryKey: ['/api/student-guardians'] });
      
      // Ophalen van bestaande guardian-student relaties
      const guardianId = variables.id;
      try {
        // Zou eigenlijk een aparte query moeten zijn, maar we gebruiken een directe API-aanroep hier
        const existingRelations = await apiRequest('GET', `/api/guardians/${guardianId}/students`);
        const existingStudentIds = existingRelations.map((rel: any) => rel.studentId);
        
        // Nieuwe relaties toevoegen
        const studentsToAdd = guardianFormData.studentIds.filter(id => !existingStudentIds.includes(id));
        
        // Ontbrekende relaties verwijderen (studenten ontkoppelen)
        const studentsToRemove = existingStudentIds.filter(id => !guardianFormData.studentIds.includes(id));
        
        // Alle nieuwe relaties aanmaken
        if (studentsToAdd.length > 0) {
          const addPromises = studentsToAdd.map(studentId => 
            createStudentGuardianMutation.mutateAsync({
              studentId,
              guardianId: guardianId,
              isPrimary: false
            })
          );
          await Promise.all(addPromises);
        }
        
        // Alle verwijderde relaties verwijderen
        if (studentsToRemove.length > 0) {
          // Dit zou eigenlijk een aparte verwijdermutatie moeten zijn
          for (const studentId of studentsToRemove) {
            const relationToRemove = existingRelations.find((rel: any) => rel.studentId === studentId);
            if (relationToRemove) {
              await apiRequest('DELETE', `/api/student-guardians/${relationToRemove.id}`);
            }
          }
        }
        
        // Refresh de student-guardian data
        queryClient.invalidateQueries({ queryKey: ['/api/student-guardians'] });
        
      } catch (error) {
        console.error("Fout bij bijwerken van student-voogd relaties:", error);
        toast({
          title: "Let op",
          description: "Voogd is bijgewerkt maar er was een probleem met het bijwerken van gekoppelde studenten.",
          variant: "destructive",
        });
      }
      
      // Reset form and close dialog
      setIsEditDialogOpen(false);
      setSelectedGuardian(null);
      setSelectedStudents([]);
      
      // Toon succes melding
      toast({
        title: "Voogd bijgewerkt",
        description: "De voogd is succesvol bijgewerkt.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van de voogd.",
        variant: "destructive",
      });
    }
  });
  
  // Mutatie voor het verwijderen van een verzorger
  const deleteGuardianMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/guardians/${id}`);
    },
    onSuccess: () => {
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      
      // Reset form and close dialog
      setIsDeleteDialogOpen(false);
      setSelectedGuardian(null);
      
      // Toon succes melding
      toast({
        title: "Voogd verwijderd",
        description: "De voogd is succesvol verwijderd uit het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van de voogd.",
        variant: "destructive",
      });
    }
  });

  const handleAddGuardian = () => {
    setIsAddDialogOpen(true);
  };
  
  const handleEditGuardian = async (guardian: Guardian) => {
    setSelectedGuardian(guardian);
    
    // Reset studentIds en selectedStudents
    setSelectedStudents([]);
    
    // Haal gekoppelde studenten op
    try {
      const relations = await apiRequest('GET', `/api/guardians/${guardian.id}/students`);
      const studentIds = relations.map((rel: any) => rel.studentId);
      
      // Haal studentgegevens op voor weergave
      if (studentIds.length > 0) {
        const studentPromises = studentIds.map((id: number) => 
          apiRequest('GET', `/api/students/${id}`)
        );
        
        const students = await Promise.all(studentPromises);
        setSelectedStudents(
          students.map((student: any) => ({
            id: student.id,
            name: `${student.firstName} ${student.lastName}`
          }))
        );
      }
      
      setGuardianFormData({
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        relationship: guardian.relationship,
        email: guardian.email,
        phone: guardian.phone,
        street: guardian.street || '',
        houseNumber: guardian.houseNumber || '',
        postalCode: guardian.postalCode || '',
        city: guardian.city || '',
        occupation: guardian.occupation || '',
        isEmergencyContact: guardian.isEmergencyContact,
        notes: guardian.notes || '',
        studentIds: studentIds
      });
      
    } catch (error) {
      console.error("Fout bij ophalen van gekoppelde studenten:", error);
      
      // In geval van fout, toch de dialoog openen maar zonder studentgegevens
      setGuardianFormData({
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        relationship: guardian.relationship,
        email: guardian.email,
        phone: guardian.phone,
        street: guardian.street || '',
        houseNumber: guardian.houseNumber || '',
        postalCode: guardian.postalCode || '',
        city: guardian.city || '',
        occupation: guardian.occupation || '',
        isEmergencyContact: guardian.isEmergencyContact,
        notes: guardian.notes || '',
        studentIds: []
      });
      
      toast({
        title: "Let op",
        description: "De gekoppelde studenten konden niet worden opgehaald.",
        variant: "destructive",
      });
    }
    
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteGuardian = (guardian: Guardian) => {
    setSelectedGuardian(guardian);
    setIsDeleteDialogOpen(true);
  };
  
  const handleSubmitGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    createGuardianMutation.mutate(guardianFormData);
  };
  
  const handleSubmitEditGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGuardian) {
      updateGuardianMutation.mutate({
        id: selectedGuardian.id,
        guardianData: guardianFormData
      });
    }
  };
  
  const confirmDeleteGuardian = () => {
    if (selectedGuardian) {
      deleteGuardianMutation.mutate(selectedGuardian.id);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleRelationChange = (value: string) => {
    setRelation(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Functies voor studentenzoekbalk
  const handleOpenStudentSearch = () => {
    setStudentSearchTerm('');
    setIsStudentSearchDialogOpen(true);
  };
  
  const handleStudentSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudentSearchTerm(e.target.value);
  };
  
  const handleSelectStudent = (student: any) => {
    // Typesafe studentId verkrijgen door te controleren of het een getal is
    const studentId = typeof student.id === 'string' ? parseInt(student.id) : student.id;
    
    // Alleen doorgaan als het een geldig getal is
    if (isNaN(studentId)) {
      console.error("Ongeldige student ID:", student.id);
      toast({
        title: "Fout bij selecteren student",
        description: "De geselecteerde student heeft een ongeldig ID.",
        variant: "destructive",
      });
      return;
    }
    
    const studentExists = selectedStudents.some(s => s.id === studentId);
    
    if (!studentExists) {
      setSelectedStudents([
        ...selectedStudents, 
        { id: studentId, name: `${student.firstName} ${student.lastName}` }
      ]);
      
      // Ook aan de form data toevoegen
      setGuardianFormData({
        ...guardianFormData,
        studentIds: [...guardianFormData.studentIds, studentId]
      });
      
      console.log("Student toegevoegd:", studentId, student.firstName, student.lastName);
    }
  };
  
  const handleRemoveSelectedStudent = (studentId: number) => {
    setSelectedStudents(selectedStudents.filter(s => s.id !== studentId));
    setGuardianFormData({
      ...guardianFormData,
      studentIds: guardianFormData.studentIds.filter(id => id !== studentId)
    });
  };

  // Handler voor de vernieuwknop
  const handleRefresh = async () => {
    console.log("Vernieuwen van voogdenlijst...");
    // Forceer een vernieuwing van de gegevens
    await refetch();
    
    // Wis ook de client cache voor het guardians endpoint
    queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
    
    // Toon een bevestigingsmelding
    toast({
      title: "Vernieuwd",
      description: "De voogdenlijst is vernieuwd",
      variant: "default",
    });
  };
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Voogdenbeheer</h1>
          <p className="text-gray-500 mt-1">
            Beheer voogden, ouders en hun relaties met studenten
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Zoek voogden..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            className="flex items-center"
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
              className="mr-2"
            >
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
            <span>Vernieuwen</span>
          </Button>
          <Button onClick={handleAddGuardian} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Voogd Toevoegen</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Relatie</label>
            <Select value={relation} onValueChange={handleRelationChange}>
              <SelectTrigger>
                <SelectValue placeholder="Alle Relaties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Relaties</SelectItem>
                <SelectItem value="parent">Ouder</SelectItem>
                <SelectItem value="guardian">Voogd</SelectItem>
                <SelectItem value="other">Overig</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Guardian List Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {isLoading ? 'Laden...' : `Toont ${Array.isArray(data) ? data.length : 0} voogd(en)`}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
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
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                <path d="M3 22v-6h6"></path>
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
              </svg>
              Vernieuwen
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filteren
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exporteren
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                    />
                    Voogd
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relatie</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Studenten</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Voogden laden...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-red-500">
                    Fout bij het laden van voogden. Probeer het opnieuw.
                  </td>
                </tr>
              ) : !Array.isArray(data) || data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Geen voogden gevonden. Klik op 'Vernieuwen' of voeg nieuwe voogden toe.
                  </td>
                </tr>
              ) : (
                // Gebruik de echte data van de API
                Array.isArray(data) && data.map((guardian: Guardian) => (
                  <tr key={guardian.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                        />
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{guardian.firstName[0]}{guardian.lastName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{guardian.firstName} {guardian.lastName}</div>
                            <div className="text-sm text-gray-500">{guardian.email}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge>
                        {guardian.relationship === 'parent' ? 'Ouder' : 
                         guardian.relationship === 'guardian' ? 'Voogd' : 'Overig'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{guardian.phone}</div>
                      <div className="text-sm text-gray-500">
                        {guardian.street && guardian.houseNumber ? 
                          `${guardian.street} ${guardian.houseNumber}, ${guardian.postalCode || ''} ${guardian.city || ''}` : 
                          'Geen adres opgegeven'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex -space-x-2">
                        {/* Placeholder voor gekoppelde studenten - studentgegevens zijn niet direct beschikbaar */}
                        <Avatar className="h-6 w-6 border-2 border-white">
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-600">?</AvatarFallback>
                        </Avatar>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setSelectedGuardian(guardian);
                            setIsViewGuardianDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                          <span className="sr-only">Bekijken</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditGuardian(guardian)}
                        >
                          <Edit className="h-4 w-4 text-blue-500" />
                          <span className="sr-only">Bewerken</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteGuardian(guardian)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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

        {/* Pagination - alleen tonen als er meerdere pagina's zijn */}
        {Array.isArray(data) && Math.ceil(data.length / 10) > 1 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Vorige
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Volgende
              </Button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {Array.isArray(data) ? (
                    <>
                      Tonen <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> tot{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * 10, data.length)}
                      </span>{" "}
                      van <span className="font-medium">{data.length}</span> resultaten
                    </>
                  ) : (
                    <>Geen resultaten beschikbaar</>
                  )}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-l-md"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Vorige
                  </Button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button 
                      key={i}
                      variant={currentPage === i + 1 ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-r-md"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Volgende
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Guardian Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Voogd toevoegen</DialogTitle>
            <DialogDescription>
              Vul de voogdinformatie in. Klik op opslaan wanneer je klaar bent.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitGuardian}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="firstName" className="text-right">
                    Voornaam
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="Voornaam"
                    value={guardianFormData.firstName}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, firstName: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="lastName" className="text-right">
                    Achternaam
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Achternaam"
                    value={guardianFormData.lastName}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, lastName: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="relationship" className="text-right">
                    Relatie
                  </Label>
                  <Select
                    value={guardianFormData.relationship}
                    onValueChange={(value) => setGuardianFormData({ ...guardianFormData, relationship: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer relatie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Ouder</SelectItem>
                      <SelectItem value="guardian">Voogd</SelectItem>
                      <SelectItem value="other">Overig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Label htmlFor="isEmergencyContact" className="text-right">
                    Noodcontact
                  </Label>
                  <div className="flex items-center mt-3">
                    <Checkbox
                      id="isEmergencyContact"
                      checked={guardianFormData.isEmergencyContact}
                      onCheckedChange={(checked) => 
                        setGuardianFormData({ 
                          ...guardianFormData, 
                          isEmergencyContact: checked as boolean 
                        })
                      }
                    />
                    <label
                      htmlFor="isEmergencyContact"
                      className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Is noodcontact
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={guardianFormData.email}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, email: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="phone" className="text-right">
                    Telefoon
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+31 6 12345678"
                    value={guardianFormData.phone}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, phone: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="street" className="text-right">
                    Straatnaam
                  </Label>
                  <Input
                    id="street"
                    placeholder="Straatnaam"
                    value={guardianFormData.street || ''}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, street: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="houseNumber" className="text-right">
                    Huisnummer
                  </Label>
                  <Input
                    id="houseNumber"
                    placeholder="123"
                    value={guardianFormData.houseNumber || ''}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, houseNumber: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="postalCode" className="text-right">
                    Postcode
                  </Label>
                  <Input
                    id="postalCode"
                    placeholder="1234 AB"
                    value={guardianFormData.postalCode || ''}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, postalCode: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="city" className="text-right">
                    Stad
                  </Label>
                  <Input
                    id="city"
                    placeholder="Amsterdam"
                    value={guardianFormData.city || ''}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, city: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1">
                <div className="col-span-1">
                  <Label htmlFor="occupation" className="text-right">
                    Beroep
                  </Label>
                  <Input
                    id="occupation"
                    placeholder="Beroep"
                    value={guardianFormData.occupation}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, occupation: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1">
                <div className="col-span-1">
                  <Label htmlFor="notes" className="text-right">
                    Notities
                  </Label>
                  <Input
                    id="notes"
                    placeholder="Aanvullende informatie"
                    value={guardianFormData.notes}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, notes: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 mt-4">
                <div className="col-span-1">
                  <Label className="text-right mb-2 block">
                    Gekoppelde studenten
                  </Label>
                  <div className="flex flex-col space-y-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleOpenStudentSearch}
                      className="w-full justify-center"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Zoek studenten om te koppelen
                    </Button>
                    
                    {selectedStudents.length === 0 ? (
                      <p className="text-sm text-gray-500">Geen studenten geselecteerd</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                        {selectedStudents.map(student => (
                          <Badge key={student.id} className="flex items-center gap-1 pl-2">
                            {student.name}
                            <button 
                              type="button"
                              onClick={() => handleRemoveSelectedStudent(student.id)}
                              className="ml-1 rounded-full hover:bg-gray-400/20 p-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                              <span className="sr-only">Verwijderen</span>
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                disabled={createGuardianMutation.isPending}
              >
                {createGuardianMutation.isPending ? 'Bezig met toevoegen...' : 'Voogd toevoegen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Guardian Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Voogd bewerken</DialogTitle>
            <DialogDescription>
              Bewerk de voogdinformatie. Klik op opslaan wanneer je klaar bent.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEditGuardian}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="edit-firstName" className="text-right">
                    Voornaam
                  </Label>
                  <Input
                    id="edit-firstName"
                    placeholder="Voornaam"
                    value={guardianFormData.firstName}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, firstName: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="edit-lastName" className="text-right">
                    Achternaam
                  </Label>
                  <Input
                    id="edit-lastName"
                    placeholder="Achternaam"
                    value={guardianFormData.lastName}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, lastName: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="edit-relationship" className="text-right">
                    Relatie
                  </Label>
                  <Select
                    value={guardianFormData.relationship}
                    onValueChange={(value) => setGuardianFormData({ ...guardianFormData, relationship: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer relatie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Ouder</SelectItem>
                      <SelectItem value="guardian">Voogd</SelectItem>
                      <SelectItem value="other">Overig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Label htmlFor="edit-isEmergencyContact" className="text-right">
                    Noodcontact
                  </Label>
                  <div className="flex items-center mt-3">
                    <Checkbox
                      id="edit-isEmergencyContact"
                      checked={guardianFormData.isEmergencyContact}
                      onCheckedChange={(checked) => 
                        setGuardianFormData({ 
                          ...guardianFormData, 
                          isEmergencyContact: checked as boolean 
                        })
                      }
                    />
                    <label
                      htmlFor="edit-isEmergencyContact"
                      className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Is noodcontact
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="edit-email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    placeholder="email@example.com"
                    value={guardianFormData.email}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, email: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="edit-phone" className="text-right">
                    Telefoon
                  </Label>
                  <Input
                    id="edit-phone"
                    placeholder="+31 6 12345678"
                    value={guardianFormData.phone}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, phone: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
              </div>



              <div className="grid grid-cols-1">
                <div className="col-span-1">
                  <Label htmlFor="edit-occupation" className="text-right">
                    Beroep
                  </Label>
                  <Input
                    id="edit-occupation"
                    placeholder="Beroep"
                    value={guardianFormData.occupation}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, occupation: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1">
                <div className="col-span-1">
                  <Label htmlFor="edit-notes" className="text-right">
                    Notities
                  </Label>
                  <Input
                    id="edit-notes"
                    placeholder="Aanvullende informatie"
                    value={guardianFormData.notes}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, notes: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 mt-4">
                <div className="col-span-1">
                  <Label className="text-right mb-2 block">
                    Gekoppelde studenten
                  </Label>
                  <div className="flex flex-col space-y-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleOpenStudentSearch}
                      className="w-full justify-center"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Zoek studenten om te koppelen
                    </Button>
                    
                    {selectedStudents.length === 0 ? (
                      <p className="text-sm text-gray-500">Geen studenten geselecteerd</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                        {selectedStudents.map(student => (
                          <Badge key={student.id} className="flex items-center gap-1 pl-2">
                            {student.name}
                            <button 
                              type="button"
                              onClick={() => handleRemoveSelectedStudent(student.id)}
                              className="ml-1 rounded-full hover:bg-gray-400/20 p-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                              <span className="sr-only">Verwijderen</span>
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                disabled={updateGuardianMutation.isPending}
              >
                {updateGuardianMutation.isPending ? 'Bezig met bijwerken...' : 'Wijzigingen opslaan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Guardian Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Voogd verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze voogd wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            {selectedGuardian && (
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="font-semibold">{selectedGuardian.firstName} {selectedGuardian.lastName}</p>
                <p className="text-sm text-gray-500">{selectedGuardian.email}</p>
                <p className="text-sm text-gray-500">Relatie: {
                  selectedGuardian.relationship === 'parent' ? 'Ouder' : 
                  selectedGuardian.relationship === 'guardian' ? 'Voogd' : 'Overig'
                }</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button 
              type="button"
              variant="destructive" 
              onClick={confirmDeleteGuardian}
              disabled={deleteGuardianMutation.isPending}
            >
              {deleteGuardianMutation.isPending ? 'Bezig met verwijderen...' : 'Verwijderen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Studenten Zoekdialog */}
      <Dialog open={isStudentSearchDialogOpen} onOpenChange={setIsStudentSearchDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Zoek Studenten</DialogTitle>
            <DialogDescription>
              Zoek en selecteer studenten om aan deze voogd te koppelen.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="relative mb-4">
              <Input
                placeholder="Zoek op naam, e-mail of studentnummer..."
                value={studentSearchTerm}
                onChange={handleStudentSearchChange}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <div className="my-4">
              <h3 className="text-sm font-medium mb-2">Geselecteerde studenten:</h3>
              {selectedStudents.length === 0 ? (
                <p className="text-sm text-gray-500">Geen studenten geselecteerd</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedStudents.map(student => (
                    <Badge key={student.id} className="flex items-center gap-1 pl-2">
                      {student.name}
                      <button 
                        onClick={() => handleRemoveSelectedStudent(student.id)}
                        className="ml-1 rounded-full hover:bg-gray-400/20 p-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        <span className="sr-only">Verwijderen</span>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border rounded-md overflow-hidden mt-4">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h3 className="font-medium">Zoekresultaten</h3>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                {isSearchingStudents ? (
                  <div className="p-4 text-center text-sm text-gray-500">Studenten zoeken...</div>
                ) : !studentSearchTerm ? (
                  <div className="p-4 text-center text-sm text-gray-500">Begin met typen om studenten te zoeken</div>
                ) : studentSearchData && studentSearchData.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">Geen studenten gevonden</div>
                ) : (
                  <ul className="divide-y">
                    {studentSearchData && studentSearchData.map((student: any) => (
                      <li 
                        key={student.id} 
                        className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleSelectStudent(student)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{student.firstName[0]}{student.lastName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.firstName} {student.lastName}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{student.studentId}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              onClick={() => setIsStudentSearchDialogOpen(false)}
            >
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Voogd Details Dialog */}
      <Dialog open={isViewGuardianDialogOpen} onOpenChange={setIsViewGuardianDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Voogd Details</DialogTitle>
            <DialogDescription>
              Gedetailleerde informatie over de voogd.
            </DialogDescription>
          </DialogHeader>
          
          {selectedGuardian && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarFallback className="text-xl">
                    {selectedGuardian.firstName?.[0]}{selectedGuardian.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedGuardian.firstName} {selectedGuardian.lastName}</h3>
                  <Badge variant="outline">{selectedGuardian.relationship}</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Email</h4>
                  <p>{selectedGuardian.email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Telefoon</h4>
                  <p>{selectedGuardian.phone}</p>
                </div>
              </div>
              
              <div className="pt-2 pb-4 border-b">
                <h4 className="text-sm font-medium text-gray-500">Adres</h4>
                {selectedGuardian.street || selectedGuardian.city ? (
                  <div>
                    <p>{selectedGuardian.street || ''} {selectedGuardian.houseNumber || ''}</p>
                    <p>{selectedGuardian.postalCode || ''} {selectedGuardian.city || ''}</p>
                  </div>
                ) : (
                  <p>{selectedGuardian.address || 'Geen adres opgegeven'}</p>
                )}
              </div>
              
              <div className="pt-2">
                <h4 className="text-sm font-medium text-gray-500">Beroep</h4>
                <p>{selectedGuardian.occupation || 'Niet opgegeven'}</p>
              </div>
              
              {selectedGuardian.isEmergencyContact && (
                <div className="pt-2">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    Noodcontact
                  </Badge>
                </div>
              )}
              
              {selectedGuardian.notes && (
                <div className="pt-2">
                  <h4 className="text-sm font-medium text-gray-500">Notities</h4>
                  <p className="whitespace-pre-wrap text-sm">{selectedGuardian.notes}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsViewGuardianDialogOpen(false)}
            >
              Sluiten
            </Button>
            <Button 
              type="button"
              onClick={() => {
                setIsViewGuardianDialogOpen(false);
                handleEditGuardian(selectedGuardian as GuardianType);
              }}
            >
              Bewerken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}