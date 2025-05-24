import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Download, Eye, Pencil, Trash2, UserCheck, X, XCircle, FileDown, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from '@/components/ui/checkbox';
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
      {/* Delete bevestiging dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Voogd verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze voogd wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          
          {selectedGuardian && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
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
          
          <DialogFooter className="sm:justify-between">
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
          className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white gap-2"
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
                        ) : (
                          <Button 
                            className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white gap-2"
                            onClick={handleAddNewGuardian}
                            size="sm"
                          >
                            <PlusCircle className="h-4 w-4" />
                            Nieuwe Voogd
                          </Button>
                        )}
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
