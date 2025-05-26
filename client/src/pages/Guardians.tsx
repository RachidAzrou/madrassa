import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Download, Eye, Pencil, Trash2, UserCheck, X, XCircle, FileDown, AlertTriangle, Phone, Save, Mail, UserPlus, HeartPulse, AlertCircle } from 'lucide-react';
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
import { PremiumHeader } from '@/components/layout/premium-header';
import { 
  CustomDialog, 
  DialogHeaderWithIcon, 
  DialogFormContainer, 
  SectionContainer, 
  DialogFooterContainer 
} from '@/components/ui/custom-dialog';
import {
  ActionButtonsContainer,
  EmptyActionHeader
} from '@/components/ui/data-table-container';
import { DeleteDialog } from '@/components/ui/delete-dialog';

// Type definities
type GuardianType = {
  id: number;
  firstName: string;
  lastName: string;
  relationship: string;
  relationshipOther?: string;
  email: string;
  phone?: string;
  isEmergencyContact: boolean;
  emergencyContactFirstName?: string;
  emergencyContactLastName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
};

export default function Guardians() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuardians, setSelectedGuardians] = useState<number[]>([]);
  const [linkedStudentId, setLinkedStudentId] = useState<string | null>(null);
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNewGuardianDialog, setShowNewGuardianDialog] = useState(false);
  const [hasValidationAttempt, setHasValidationAttempt] = useState(false);
  const [newGuardian, setNewGuardian] = useState<Partial<GuardianType>>({
    firstName: '',
    lastName: '',
    relationship: 'parent',
    relationshipOther: '',
    email: '',
    phone: '',
    isEmergencyContact: false,
    emergencyContactFirstName: '',
    emergencyContactLastName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  });
  
  // Data ophalen
  const { data: guardians = [], isLoading, isError } = useQuery({
    queryKey: ['/api/guardians'],
    queryFn: async () => {
      const response = await apiRequest('/api/guardians');
      return response;
    }
  });

  // URL parameters controleren bij het laden van de pagina
  useEffect(() => {
    // URL parameters uitlezen
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const studentId = urlParams.get('studentId');
    
    // Controleer ook op gegevens in localStorage (als backup)
    const pendingStudentId = localStorage.getItem('pendingStudentForGuardian');
    
    if ((action === 'add' && studentId) || pendingStudentId) {
      // Sla de student ID op voor later gebruik bij het koppelen
      setLinkedStudentId(studentId || pendingStudentId);
      
      // Open automatisch het dialoogvenster voor het toevoegen van een voogd
      setShowNewGuardianDialog(true);
      
      // Toon een melding aan de gebruiker
      toast({
        title: "Voogd toevoegen",
        description: `Je bent bezig met het toevoegen van een voogd voor student ${studentId || pendingStudentId}`,
      });
      
      // Verwijder de student ID uit localStorage om te voorkomen dat het dialoogvenster opnieuw wordt geopend
      localStorage.removeItem('pendingStudentForGuardian');
      
      // Verwijder de parameters uit de URL zonder de pagina te verversen
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);
  
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

  const handleDeleteGuardian = (guardian: GuardianType) => {
    setSelectedGuardian(guardian);
    setShowDeleteDialog(true);
  };

  const confirmDeleteGuardian = async () => {
    if (!selectedGuardian) return;
    
    try {
      await apiRequest(`/api/guardians/${selectedGuardian.id}`, {
        method: 'DELETE'
      });
      
      toast({
        title: "Voogd verwijderd",
        description: "De voogd is succesvol verwijderd.",
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

  // Valideren van het nieuwe voogd formulier
  const validateNewGuardian = () => {
    // Controleren of verplichte velden zijn ingevuld: voornaam, achternaam, telefoonnummer en relatie
    if (!newGuardian.firstName || !newGuardian.lastName || !newGuardian.phone || !newGuardian.relationship) {
      // Extra validatie voor het "anders" relatietype
      if (newGuardian.relationship === 'other' && !newGuardian.relationshipOther) {
        toast({
          title: "Ontbrekende velden",
          description: "Specificeer de relatie tot de student.",
          variant: "destructive",
        });
        return false;
      }
      
      toast({
        title: "Ontbrekende velden",
        description: "Vul alle verplichte velden in (voornaam, achternaam, telefoonnummer en relatie tot student).",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Opslaan van nieuwe voogd
  const handleSaveGuardian = async () => {
    // Markeer dat we validatie hebben geprobeerd
    setHasValidationAttempt(true);
    
    if (!validateNewGuardian()) return;
    
    try {
      // Stap 1: Maak eerst de nieuwe voogd aan
      const guardianResponse = await apiRequest('/api/guardians', {
        method: 'POST',
        body: newGuardian
      });
      
      // Stap 2: Als er een student ID is meegegeven, koppel de voogd aan deze student
      if (linkedStudentId) {
        try {
          // Koppel de voogd aan de student via de student-guardians relatie
          await apiRequest('/api/student-guardians', {
            method: 'POST',
            body: {
              studentId: linkedStudentId,
              guardianId: guardianResponse.id
            }
          });
          
          toast({
            title: "Voogd toegevoegd",
            description: `De nieuwe voogd is succesvol toegevoegd en gekoppeld aan student ${linkedStudentId}.`,
          });
          
          // Reset de gekoppelde student ID
          setLinkedStudentId(null);
        } catch (linkError) {
          console.error('Fout bij koppelen van voogd aan student:', linkError);
          toast({
            title: "Voogd toegevoegd, maar niet gekoppeld",
            description: "De voogd is aangemaakt maar kon niet worden gekoppeld aan de student. Probeer de koppeling handmatig te maken.",
            variant: "warning"
          });
        }
      } else {
        toast({
          title: "Voogd toegevoegd",
          description: "De nieuwe voogd is succesvol toegevoegd.",
        });
      }
      
      // Reset formulier en sluit dialoog
      setNewGuardian({
        firstName: '',
        lastName: '',
        relationship: 'parent',
        email: '',
        phone: '',
        isEmergencyContact: false
      });
      setShowNewGuardianDialog(false);
      
      // Vernieuw de lijsten
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-guardians'] });
    } catch (error) {
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een probleem opgetreden bij het toevoegen van de voogd.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Premium header component */}
      <PremiumHeader 
        title="Voogden" 
        icon={UserCheck}
        description="Beheer ouders en voogden van studenten, inclusief contactgegevens en noodcontacten"
        breadcrumbs={{
          parent: "Beheer",
          current: "Voogden"
        }}
      />
      {/* Main content area */}
      <div className="px-6 py-6 flex-1">
        {/* Zoek- en actiebalk - Desktop style */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm mb-4">
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            {/* Zoekbalk */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Zoek op naam of email..."
                className="w-full pl-9 h-8 text-xs rounded-sm bg-white border-[#e5e7eb]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Acties */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedGuardians.length > 0 ? (
                <>
                  <span className="text-xs text-gray-500">{selectedGuardians.length} geselecteerd</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGuardians([])}
                    className="h-7 text-xs rounded-sm"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Wissen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteSelectedGuardians}
                    className="h-7 text-xs rounded-sm border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Verwijderen
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportSelectedGuardians}
                    className="h-7 text-xs rounded-sm border-[#e5e7eb]"
                  >
                    <FileDown className="h-3.5 w-3.5 mr-1" />
                    Exporteren
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddNewGuardian}
                    className="h-7 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    Nieuwe Voogd
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabel van voogden - Desktop style */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e5e7eb]">
              <thead className="bg-[#f9fafc]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left w-10">
                    <Checkbox 
                      checked={selectedGuardians.length > 0 && selectedGuardians.length === searchResults.length}
                      onCheckedChange={handleToggleAllGuardians}
                      className="h-3.5 w-3.5 rounded-sm border-[#e5e7eb]"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Naam</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Relatie</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">E-mail</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Telefoon</span>
                  </th>
                  <EmptyActionHeader />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e5e7eb]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="w-6 h-6 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-sm text-gray-500">Laden...</span>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center py-6">
                        <XCircle className="h-8 w-8 text-red-500 mb-2" />
                        <p className="text-sm text-red-500">Fout bij het laden van voogden.</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/guardians'] })}
                          className="mt-2 h-7 text-xs rounded-sm"
                        >
                          Opnieuw proberen
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : searchResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="py-6">
                        <EmptyState
                          icon={<UserCheck className="h-12 w-12 mx-auto text-gray-300" />}
                          title="Geen voogden gevonden"
                          description={searchQuery.trim() !== '' 
                            ? 'Geen voogden gevonden die overeenkomen met je zoekopdracht. Probeer een andere zoekterm.' 
                            : 'Er zijn nog geen voogden toegevoegd in het systeem.'}
                        />
                        {searchQuery.trim() !== '' && (
                          <Button 
                            variant="outline"
                            className="mt-4 h-7 text-xs rounded-sm" 
                            onClick={() => setSearchQuery('')}
                            size="sm"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Wis Zoekopdracht
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  searchResults.map((guardian: GuardianType) => (
                    <tr key={guardian.id} className="group hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedGuardians.includes(guardian.id)}
                          onCheckedChange={() => toggleGuardianSelection(guardian.id)}
                          className="h-3.5 w-3.5 rounded-sm border-[#e5e7eb]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Avatar className="h-7 w-7 mr-3">
                            <AvatarFallback className="text-xs bg-[#e5e7eb] text-gray-600">
                              {guardian.firstName.charAt(0)}{guardian.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-medium text-gray-900">{guardian.firstName} {guardian.lastName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant="outline" 
                          className={`text-xs rounded-sm ${guardian.isEmergencyContact 
                            ? "bg-red-50 text-red-700 border-red-200" 
                            : "bg-blue-50 text-blue-700 border-blue-200"}`}
                        >
                          {getRelationshipLabel(guardian.relationship)}
                          {guardian.isEmergencyContact && " (Nood)"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{guardian.email}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{guardian.phone || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <ActionButtonsContainer>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowGuardianDetails(guardian)}
                            className="h-7 w-7 p-0 text-gray-500"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditGuardian(guardian)}
                            className="h-7 w-7 p-0 text-gray-500"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGuardian(guardian)}
                            className="h-7 w-7 p-0 text-gray-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </ActionButtonsContainer>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Dialogen */}
      {/* Verwijder dialoog */}
      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Voogd Verwijderen"
        description="Weet je zeker dat je deze voogd wilt verwijderen?"
        onConfirm={confirmDeleteGuardian}
        item={selectedGuardian ? {
          name: `${selectedGuardian.firstName} ${selectedGuardian.lastName}`,
          id: selectedGuardian.email,
          initials: `${selectedGuardian.firstName.charAt(0)}${selectedGuardian.lastName.charAt(0)}`
        } : undefined}
        warningText="Deze actie kan niet ongedaan worden gemaakt. De voogd wordt permanent verwijderd uit het systeem."
      />
      {/* Nieuwe voogd dialoog */}
      <Dialog 
        open={showNewGuardianDialog} 
        onOpenChange={setShowNewGuardianDialog}
      >
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <div className="bg-[#1e40af] py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-semibold m-0">Nieuwe Voogd Toevoegen</DialogTitle>
                <DialogDescription className="text-white/70 text-sm m-0">
                  Vul de gegevens in om een nieuwe voogd toe te voegen.
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 150px)' }}>
            <Tabs defaultValue="gegevens" className="mb-4">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="gegevens" className="flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Persoonlijke gegevens</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-2">
                  <HeartPulse className="h-3.5 w-3.5" />
                  <span>Noodcontact</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="gegevens" className="space-y-4 min-h-[300px]">
                <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                  <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Persoonlijke Informatie
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">
                        Voornaam <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="firstName" 
                        placeholder="Voornaam" 
                        className={`h-8 text-sm ${hasValidationAttempt && !newGuardian.firstName ? 'border-red-300' : ''}`}
                        value={newGuardian.firstName}
                        onChange={(e) => setNewGuardian({...newGuardian, firstName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-xs font-medium text-gray-700">
                        Achternaam <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="lastName" 
                        placeholder="Achternaam" 
                        className={`h-8 text-sm ${hasValidationAttempt && !newGuardian.lastName ? 'border-red-300' : ''}`}
                        value={newGuardian.lastName}
                        onChange={(e) => setNewGuardian({...newGuardian, lastName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-medium text-gray-700">
                        Telefoonnummer <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="phone" 
                        placeholder="Telefoonnummer" 
                        className={`h-8 text-sm ${hasValidationAttempt && !newGuardian.phone ? 'border-red-300' : ''}`}
                        value={newGuardian.phone || ''}
                        onChange={(e) => setNewGuardian({...newGuardian, phone: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                        E-mailadres
                      </Label>
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="E-mailadres" 
                        className="h-8 text-sm"
                        value={newGuardian.email || ''}
                        onChange={(e) => setNewGuardian({...newGuardian, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="relationship" className="text-xs font-medium text-gray-700">
                        Relatie tot Student <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={newGuardian.relationship} 
                        onValueChange={(value) => setNewGuardian({...newGuardian, relationship: value})}
                        required
                      >
                        <SelectTrigger id="relationship" className={`h-8 text-sm border-gray-300 ${hasValidationAttempt && !newGuardian.relationship ? 'border-red-300' : ''}`}>
                          <SelectValue placeholder="Selecteer een relatie" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="parent" className="text-black hover:bg-blue-100 focus:bg-blue-200">Ouder</SelectItem>
                          <SelectItem value="guardian" className="text-black hover:bg-blue-100 focus:bg-blue-200">Voogd</SelectItem>
                          <SelectItem value="grandparent" className="text-black hover:bg-blue-100 focus:bg-blue-200">Grootouder</SelectItem>
                          <SelectItem value="sibling" className="text-black hover:bg-blue-100 focus:bg-blue-200">Broer/Zus</SelectItem>
                          <SelectItem value="other" className="text-black hover:bg-blue-100 focus:bg-blue-200">Anders</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {newGuardian.relationship === 'other' && (
                      <div className="space-y-2">
                        <Label htmlFor="relationshipOther">
                          Specificeer relatie <span className="text-red-500">*</span>
                        </Label>
                        <Input 
                          id="relationshipOther" 
                          placeholder="Beschrijf de relatie" 
                          className={`h-8 text-sm ${hasValidationAttempt && newGuardian.relationship === 'other' && !newGuardian.relationshipOther ? 'border-red-300' : ''}`}
                          value={newGuardian.relationshipOther || ''}
                          onChange={(e) => setNewGuardian({...newGuardian, relationshipOther: e.target.value})}
                          required
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="isEmergencyContact" className="text-xs font-medium text-gray-700">Noodcontact</Label>
                      <div className="flex items-center gap-2 h-8 py-0.5">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="isEmergencyContact" 
                            checked={newGuardian.isEmergencyContact}
                            onCheckedChange={(checked) => 
                              setNewGuardian({
                                ...newGuardian, 
                                isEmergencyContact: checked === true
                              })
                            }
                            className="peer shrink-0 border ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:text-primary-foreground h-4 w-4 rounded-sm border-gray-300 data-[state=checked]:bg-[#1e40af] bg-[#fff]"
                          />
                          <label
                            htmlFor="isEmergencyContact"
                            className="text-sm text-gray-700 leading-none"
                          >
                            Deze persoon is een primair noodcontact
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="contact" className="space-y-4 min-h-[300px]">
                <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                  <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Informatie
                  </h3>
                  
                  {newGuardian.isEmergencyContact ? (
                    <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-sm text-amber-700">
                        Deze persoon is al ingesteld als primair noodcontact. 
                        Hieronder kunt u een secundair noodcontact toevoegen.
                      </p>
                    </div>
                  ) : null}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactFirstName" className="text-xs font-medium text-gray-700">Voornaam</Label>
                      <Input 
                        id="emergencyContactFirstName" 
                        placeholder="Voornaam" 
                        className="h-8 text-sm"
                        value={newGuardian.emergencyContactFirstName || ''}
                        onChange={(e) => setNewGuardian({...newGuardian, emergencyContactFirstName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactLastName" className="text-xs font-medium text-gray-700">Achternaam</Label>
                      <Input 
                        id="emergencyContactLastName" 
                        placeholder="Achternaam" 
                        className="h-8 text-sm"
                        value={newGuardian.emergencyContactLastName || ''}
                        onChange={(e) => setNewGuardian({...newGuardian, emergencyContactLastName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactPhone" className="text-xs font-medium text-gray-700">Telefoonnummer</Label>
                      <Input 
                        id="emergencyContactPhone" 
                        placeholder="Telefoonnummer" 
                        className="h-8 text-sm"
                        value={newGuardian.emergencyContactPhone || ''}
                        onChange={(e) => setNewGuardian({...newGuardian, emergencyContactPhone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContactRelationship" className="text-xs font-medium text-gray-700">Relatie tot student</Label>
                      <Select 
                        value={newGuardian.emergencyContactRelationship || ''} 
                        onValueChange={(value) => setNewGuardian({...newGuardian, emergencyContactRelationship: value})}
                      >
                        <SelectTrigger id="emergencyContactRelationship" className="h-8 text-sm border-gray-300">
                          <SelectValue placeholder="Selecteer een relatie" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="parent" className="text-black hover:bg-blue-100 focus:bg-blue-200">Ouder</SelectItem>
                          <SelectItem value="guardian" className="text-black hover:bg-blue-100 focus:bg-blue-200">Voogd</SelectItem>
                          <SelectItem value="grandparent" className="text-black hover:bg-blue-100 focus:bg-blue-200">Grootouder</SelectItem>
                          <SelectItem value="sibling" className="text-black hover:bg-blue-100 focus:bg-blue-200">Broer/Zus</SelectItem>
                          <SelectItem value="other" className="text-black hover:bg-blue-100 focus:bg-blue-200">Anders</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="bg-gray-50 px-6 py-3 flex justify-end gap-2 border-t">
            <Button
              variant="outline"
              onClick={() => setShowNewGuardianDialog(false)}
              className="h-8 text-xs rounded-sm"
            >
              Annuleren
            </Button>
            <Button
              onClick={handleSaveGuardian}
              className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              Opslaan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Voogd details dialoog */}
      <Dialog open={selectedGuardian !== null && !showDeleteDialog} onOpenChange={(open) => !open && setSelectedGuardian(null)}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
          <div className="bg-[#1e40af] py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-semibold m-0">Voogd details</DialogTitle>
                <DialogDescription className="text-white/70 text-sm m-0">
                  Details van de geselecteerde voogd.
                </DialogDescription>
              </div>
            </div>
          </div>
          
          {selectedGuardian && (
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 150px)' }}>
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-[#1e40af] text-white text-lg">
                    {selectedGuardian.firstName.charAt(0)}{selectedGuardian.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{selectedGuardian.firstName} {selectedGuardian.lastName}</h3>
                  <p className="text-sm text-gray-500">{getRelationshipLabel(selectedGuardian.relationship)}</p>
                </div>
                
                {selectedGuardian.isEmergencyContact && (
                  <Badge className="ml-auto bg-red-100 text-red-800 border-transparent">
                    Noodcontact
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Contactgegevens
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm">{selectedGuardian.email}</span>
                      </div>
                      {selectedGuardian.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm">{selectedGuardian.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Gekoppelde studenten
                    </h3>
                    <p className="text-sm text-gray-500 italic">Geen studenten gekoppeld</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 px-6 py-3 flex justify-end gap-2 border-t">
            <Button
              variant="outline"
              onClick={() => setSelectedGuardian(null)}
              className="h-8 text-xs rounded-sm"
            >
              Sluiten
            </Button>
            {selectedGuardian && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleEditGuardian(selectedGuardian)}
                  className="h-8 text-xs rounded-sm"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Bewerken
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedGuardian(null);
                    handleDeleteGuardian(selectedGuardian);
                  }}
                  className="h-8 text-xs rounded-sm border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Verwijderen
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}