import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Download, Eye, Pencil, Trash2, UserCheck, X, XCircle, FileDown, AlertTriangle, Phone, Save } from 'lucide-react';
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

// Type definities
type GuardianType = {
  id: number;
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  phone?: string;
  isEmergencyContact: boolean;
};

export default function Guardians() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuardians, setSelectedGuardians] = useState<number[]>([]);
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNewGuardianDialog, setShowNewGuardianDialog] = useState(false);
  const [newGuardian, setNewGuardian] = useState<Partial<GuardianType>>({
    firstName: '',
    lastName: '',
    relationship: 'parent',
    email: '',
    phone: '',
    isEmergencyContact: false
  });
  
  // Data ophalen
  const { data: guardians = [], isLoading, isError } = useQuery({
    queryKey: ['/api/guardians'],
    queryFn: async () => {
      const response = await apiRequest('/api/guardians');
      return response;
    }
  });

  // Gefilterde resultaten
  const searchResults = guardians.filter((guardian: GuardianType) => 
    guardian.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guardian.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guardian.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper functies
  const getRelationshipLabel = (relationship: string) => {
    const labels: {[key: string]: string} = {
      'parent': 'Ouder',
      'guardian': 'Voogd',
      'grandparent': 'Grootouder',
      'other': 'Anders'
    };
    return labels[relationship] || relationship;
  };

  // Selectie functies
  const toggleGuardianSelection = (id: number) => {
    setSelectedGuardians(prev => 
      prev.includes(id) 
        ? prev.filter(guardianId => guardianId !== id) 
        : [...prev, id]
    );
  };

  const handleToggleAllGuardians = () => {
    if (selectedGuardians.length === searchResults.length) {
      setSelectedGuardians([]);
    } else {
      setSelectedGuardians(searchResults.map((guardian: GuardianType) => guardian.id));
    }
  };

  // CRUD functies

  const handleShowGuardianDetails = (guardian: GuardianType) => {
    setSelectedGuardian(guardian);
  };

  const handleEditGuardian = (guardian: GuardianType) => {
    // Implementatie voor bewerken
    toast({
      title: "Niet geïmplementeerd",
      description: "Deze functie is nog niet beschikbaar.",
    });
  };

  const openDeleteConfirmation = (guardian: GuardianType) => {
    setSelectedGuardian(guardian);
    setShowDeleteDialog(true);
  };

  const handleDeleteGuardian = async () => {
    if (!selectedGuardian) return;
    
    try {
      await apiRequest(`/api/guardians/${selectedGuardian.id}`, { 
        method: 'DELETE' 
      });
      
      toast({
        title: "Voogd verwijderd",
        description: `${selectedGuardian.firstName} ${selectedGuardian.lastName} is succesvol verwijderd.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      setShowDeleteDialog(false);
      setSelectedGuardian(null);
    } catch (error) {
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een probleem opgetreden bij het verwijderen van de voogd.",
        variant: "destructive",
      });
    }
  };

  const handleAddNewGuardian = () => {
    // Direct het dialoogvenster openen zonder toast-melding
    setShowNewGuardianDialog(true);
  };

  const handleDeleteSelectedGuardians = () => {
    toast({
      title: "Niet geïmplementeerd",
      description: "Bulk verwijderen is nog niet beschikbaar.",
    });
  };

  const handleExportSelectedGuardians = () => {
    toast({
      title: "Niet geïmplementeerd",
      description: "Exporteren is nog niet beschikbaar.",
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Voogd toevoegen/bewerken dialog */}
      <Dialog open={showNewGuardianDialog} onOpenChange={setShowNewGuardianDialog}>
        <DialogContent className="sm:max-w-[85%] max-h-[90vh] h-auto overflow-y-auto p-0 [&>button[aria-label='Close']]:hidden">
          {/* Blauwe header */}
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    Nieuwe Voogd Toevoegen
                  </DialogTitle>
                  <DialogDescription className="text-sm text-blue-100 font-medium">
                    Vul de gegevens in van de nieuwe voogd of contactpersoon
                  </DialogDescription>
                </div>
              </div>
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/20 cursor-pointer"
                onClick={() => setShowNewGuardianDialog(false)}
              >
                <X className="h-4 w-4 text-white" />
                <span className="sr-only">Sluiten</span>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4">
            <form className="space-y-4">
              <Tabs defaultValue="gegevens" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4 p-1 bg-[#1e3a8a]/10 rounded-md">
                  <TabsTrigger value="gegevens" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                    <UserCheck className="h-4 w-4" />
                    <span>Persoonlijke Gegevens</span>
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                    <Phone className="h-4 w-4" />
                    <span>Contactgegevens</span>
                  </TabsTrigger>
                  <TabsTrigger value="noodcontact" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Noodcontact</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="gegevens" className="space-y-4 min-h-[300px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Voornaam</Label>
                      <Input 
                        id="firstName" 
                        placeholder="Voornaam" 
                        value={newGuardian.firstName}
                        onChange={(e) => setNewGuardian({...newGuardian, firstName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Achternaam</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Achternaam" 
                        value={newGuardian.lastName}
                        onChange={(e) => setNewGuardian({...newGuardian, lastName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center h-9 mb-1">
                        <Label className="h-6 flex items-center" htmlFor="relationship">Relatie tot Student</Label>
                      </div>
                      <Select 
                        value={newGuardian.relationship} 
                        onValueChange={(value) => setNewGuardian({...newGuardian, relationship: value})}
                      >
                        <SelectTrigger className="h-10">
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
                    <div className="space-y-2">
                      <div className="flex items-center h-9 mb-1">
                        <Label className="h-6 flex items-center">Noodcontact</Label>
                      </div>
                      <div className="flex items-center space-x-2 border rounded-md p-2 h-10">
                        <Checkbox 
                          id="isEmergencyContact" 
                          checked={newGuardian.isEmergencyContact}
                          onCheckedChange={(checked) => 
                            setNewGuardian({
                              ...newGuardian, 
                              isEmergencyContact: checked === true
                            })
                          }
                        />
                        <label
                          htmlFor="isEmergencyContact"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-[#eb2626]"
                        >
                          Deze persoon is een noodcontact
                        </label>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="contact" className="space-y-4 min-h-[300px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mailadres</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="E-mailadres" 
                        value={newGuardian.email || ''}
                        onChange={(e) => setNewGuardian({...newGuardian, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefoonnummer</Label>
                      <Input 
                        id="phone" 
                        placeholder="Telefoonnummer" 
                        value={newGuardian.phone || ''}
                        onChange={(e) => setNewGuardian({...newGuardian, phone: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Adres</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Input 
                            id="street" 
                            placeholder="Straatnaam" 
                            className="w-full"
                          />
                        </div>
                        <div>
                          <Input 
                            id="houseNumber" 
                            placeholder="Huisnummer" 
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postcode</Label>
                      <Input 
                        id="postalCode" 
                        placeholder="Postcode" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="city">Plaats</Label>
                      <Input 
                        id="city" 
                        placeholder="Plaats" 
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="noodcontact" className="space-y-4 min-h-[300px]">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-blue-600" />
                      <p className="text-sm text-blue-800">
                        De voogd aangemerkt als "noodcontact" is al toegevoegd op de eerste tab.
                        Deze tab is bedoeld voor het toevoegen van andere noodcontacten voor deze voogd.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactName">Naam noodcontact</Label>
                      <Input 
                        id="emergencyContactName" 
                        placeholder="Naam" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactPhone">Telefoonnummer noodcontact</Label>
                      <Input 
                        id="emergencyContactPhone" 
                        placeholder="Telefoonnummer" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactRelation">Relatie tot voogd</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer relatie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="family">Familie</SelectItem>
                          <SelectItem value="friend">Vriend(in)</SelectItem>
                          <SelectItem value="neighbor">Buur</SelectItem>
                          <SelectItem value="other">Anders</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="pt-4 border-t flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setShowNewGuardianDialog(false)}
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    toast({
                      title: "Voogd opslaan",
                      description: "Deze functie wordt binnenkort geïmplementeerd.",
                    });
                    setShowNewGuardianDialog(false);
                  }}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Voogd Opslaan
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete bevestiging dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md p-0 gap-0 bg-white overflow-hidden [&>button[aria-label='Close']]:hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <DialogTitle className="text-xl m-0">Voogd verwijderen</DialogTitle>
              </div>
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 cursor-pointer"
                onClick={() => setShowDeleteDialog(false)}
              >
                <X className="h-4 w-4 text-gray-600" />
                <span className="sr-only">Sluiten</span>
              </div>
            </div>
            <DialogDescription className="text-gray-500 mt-2">
              Weet je zeker dat je deze voogd wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
            
            {selectedGuardian && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Alle koppelingen met studenten worden ook verwijderd.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGuardian}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Verwijderen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Page header */}
      <div className="mb-8">
        <div className="rounded-lg overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Voogden</h1>
                <p className="text-base text-blue-100 mt-1">Beheer voogden en hun relaties met studenten</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Zoekbalk en acties */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Zoek voogden..."
            className="pl-8 bg-white"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <Button 
          onClick={handleAddNewGuardian} 
          className="hover:bg-[#1e3a8a]/90 text-white gap-2 bg-[#1e40af]"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Voogd Toevoegen</span>
        </Button>
      </div>
      {/* Voogden lijst */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <Checkbox 
                    checked={selectedGuardians.length > 0 && selectedGuardians.length === searchResults.length}
                    onCheckedChange={handleToggleAllGuardians}
                  />
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAAM</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RELATIE</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-MAIL</th>
                <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">ACTIES</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2">Laden...</span>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-red-500">
                    Fout bij het laden van voogden. Probeer het opnieuw.
                  </td>
                </tr>
              ) : searchResults.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="py-6">
                      <EmptyState
                        icon={<UserCheck className="h-12 w-12 mx-auto opacity-30" />}
                        title="Geen voogden gevonden"
                        description={searchQuery.trim() !== '' 
                          ? 'Geen voogden gevonden die overeenkomen met je zoekopdracht. Probeer een andere zoekterm.' 
                          : 'Er zijn nog geen voogden toegevoegd in het systeem.'}
                        action={searchQuery.trim() !== '' ? (
                          <Button 
                            variant="outline"
                            className="gap-2" 
                            onClick={() => setSearchQuery('')}
                            size="sm"
                          >
                            <XCircle className="h-4 w-4" />
                            Wis Zoekopdracht
                          </Button>
                        ) : null}
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                searchResults.map((guardian: GuardianType) => (
                  <tr key={guardian.id} className="group hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <Checkbox
                        checked={selectedGuardians.includes(guardian.id)}
                        onCheckedChange={() => toggleGuardianSelection(guardian.id)}
                      />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
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
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <Badge variant="outline" className={`${guardian.isEmergencyContact ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                        {getRelationshipLabel(guardian.relationship)}
                      </Badge>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{guardian.email}</span>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right">
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
                          onClick={() => openDeleteConfirmation(guardian)}
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
        
        {/* Actieknoppen voor geselecteerde voogden */}
        {selectedGuardians.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-t flex items-center justify-between">
            <span className="text-sm">
              {selectedGuardians.length} voogd{selectedGuardians.length !== 1 ? 'en' : ''} geselecteerd
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={handleExportSelectedGuardians}
              >
                <FileDown className="h-4 w-4" />
                Exporteren
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                className="gap-1"
                onClick={handleDeleteSelectedGuardians}
              >
                <Trash2 className="h-4 w-4" />
                Verwijderen
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
