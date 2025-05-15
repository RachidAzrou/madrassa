import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  const [selectedGuardian, setSelectedGuardian] = useState<Guardian | null>(null);
  const [guardianFormData, setGuardianFormData] = useState({
    firstName: '',
    lastName: '',
    relationship: 'parent',
    email: '',
    phone: '',
    address: '',
    occupation: '',
    isEmergencyContact: false,
    notes: '',
    studentIds: [] as number[]
  });

  // Fetch guardians with filters
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/guardians', { searchTerm, relation, page: currentPage }],
    staleTime: 30000,
  });

  const guardians = data?.guardians || [];
  const totalGuardians = data?.totalCount || 0;
  const totalPages = Math.ceil(totalGuardians / 10); // Assuming 10 guardians per page

  // Mutatie om een verzorger toe te voegen
  const createGuardianMutation = useMutation({
    mutationFn: async (guardianData: typeof guardianFormData) => {
      return apiRequest('POST', '/api/guardians', guardianData);
    },
    onSuccess: () => {
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      
      // Reset form and close dialog
      setGuardianFormData({
        firstName: '',
        lastName: '',
        relationship: 'parent',
        email: '',
        phone: '',
        address: '',
        occupation: '',
        isEmergencyContact: false,
        notes: '',
        studentIds: []
      });
      setIsAddDialogOpen(false);
      
      // Toon succes melding
      toast({
        title: "Verzorger toegevoegd",
        description: "De verzorger is succesvol toegevoegd aan het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de verzorger.",
        variant: "destructive",
      });
    }
  });
  
  // Mutatie voor het bijwerken van een verzorger
  const updateGuardianMutation = useMutation({
    mutationFn: async (data: { id: number; guardianData: typeof guardianFormData }) => {
      return apiRequest('PUT', `/api/guardians/${data.id}`, data.guardianData);
    },
    onSuccess: () => {
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      
      // Reset form and close dialog
      setIsEditDialogOpen(false);
      setSelectedGuardian(null);
      
      // Toon succes melding
      toast({
        title: "Verzorger bijgewerkt",
        description: "De verzorger is succesvol bijgewerkt.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van de verzorger.",
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
        title: "Verzorger verwijderd",
        description: "De verzorger is succesvol verwijderd uit het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van de verzorger.",
        variant: "destructive",
      });
    }
  });

  const handleAddGuardian = () => {
    setIsAddDialogOpen(true);
  };
  
  const handleEditGuardian = (guardian: Guardian) => {
    setSelectedGuardian(guardian);
    setGuardianFormData({
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      relationship: guardian.relationship,
      email: guardian.email,
      phone: guardian.phone,
      address: guardian.address || '',
      occupation: guardian.occupation || '',
      isEmergencyContact: guardian.isEmergencyContact,
      notes: guardian.notes || '',
      studentIds: [] // Hier zou je de gekoppelde studenten moeten ophalen
    });
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
            {isLoading ? 'Laden...' : `Toont ${guardians.length} van ${totalGuardians} voogden`}
          </div>
          <div className="flex space-x-2">
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
              ) : guardians.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Geen voogden gevonden met de huidige filters. Pas uw zoekterm of filters aan.
                  </td>
                </tr>
              ) : (
                // Demodata met werkende actieknoppen
                [
                  {
                    id: 1,
                    firstName: "John",
                    lastName: "Doe",
                    relationship: "parent",
                    email: "johndoe@example.com",
                    phone: "+1 (555) 123-4567",
                    address: "New York, USA",
                    occupation: "Engineer",
                    isEmergencyContact: true,
                    notes: null,
                    students: ["TD", "AD"]
                  },
                  {
                    id: 2,
                    firstName: "Maria",
                    lastName: "Smith",
                    relationship: "guardian",
                    email: "maria.smith@example.com",
                    phone: "+1 (555) 987-6543",
                    address: "Chicago, USA",
                    occupation: "Teacher",
                    isEmergencyContact: false,
                    notes: null,
                    students: ["JS"]
                  }
                ].map(guardian => (
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
                      <div className="text-sm text-gray-500">{guardian.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex -space-x-2">
                        {guardian.students.map((initials, idx) => (
                          <Avatar key={idx} className="h-6 w-6 border-2 border-white">
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            toast({
                              title: "Voogd details",
                              description: `Details van ${guardian.firstName} ${guardian.lastName} bekijken.`,
                              variant: "default",
                            });
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

        {/* Pagination */}
        {totalPages > 1 && (
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
                  Tonen <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> tot{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * 10, totalGuardians)}
                  </span>{" "}
                  van <span className="font-medium">{totalGuardians}</span> resultaten
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

              <div className="grid grid-cols-1">
                <div className="col-span-1">
                  <Label htmlFor="address" className="text-right">
                    Adres
                  </Label>
                  <Input
                    id="address"
                    placeholder="Volledige adres"
                    value={guardianFormData.address}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, address: e.target.value })}
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
                  <Label htmlFor="edit-address" className="text-right">
                    Adres
                  </Label>
                  <Input
                    id="edit-address"
                    placeholder="Volledige adres"
                    value={guardianFormData.address}
                    onChange={(e) => setGuardianFormData({ ...guardianFormData, address: e.target.value })}
                    className="mt-1"
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
            <DialogTitle>Verzorger verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze verzorger wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
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
    </div>
  );
}