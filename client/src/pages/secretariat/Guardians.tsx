import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Download, Eye, Pencil, Trash2, UserCheck, X, XCircle, FileDown, AlertTriangle, Phone, Save, Mail, UserPlus, HeartPulse, AlertCircle, Users, Plus } from 'lucide-react';
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
import { ExportButton } from '@/components/ui/export-button';
import { ExportDialog } from '@/components/ui/export-dialog';

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
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [hasValidationAttempt, setHasValidationAttempt] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<GuardianType>>({
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
  const [newGuardian, setNewGuardian] = useState<Partial<GuardianType> & { linkedStudents?: number[] }>({
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
    emergencyContactRelationship: '',
    linkedStudents: []
  });
  
  // Data ophalen
  const { data: guardians = [], isLoading, isError } = useQuery({
    queryKey: ['/api/guardians'],
    queryFn: async () => {
      const response = await apiRequest('/api/guardians');
      return response;
    }
  });

  // Studenten data ophalen voor gekoppelde studenten sectie
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students'],
    queryFn: async () => {
      const response = await apiRequest('/api/students');
      return response;
    }
  });

  // Filter guardians op basis van zoekterm
  const filteredGuardians = guardians.filter((guardian: GuardianType) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return guardian.firstName?.toLowerCase().includes(query) ||
           guardian.lastName?.toLowerCase().includes(query) ||
           guardian.email?.toLowerCase().includes(query) ||
           guardian.phone?.toLowerCase().includes(query);
  });

  // Helper functies
  const resetNewGuardianForm = () => {
    setNewGuardian({
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
      emergencyContactRelationship: '',
      linkedStudents: []
    });
    setHasValidationAttempt(false);
  };

  const validateGuardianForm = (guardian: Partial<GuardianType>) => {
    if (!guardian.firstName || !guardian.lastName || !guardian.relationship) {
      return false;
    }
    if (guardian.relationship === 'other' && !guardian.relationshipOther) {
      return false;
    }
    return true;
  };

  // Handle nieuw voogd toevoegen
  const createGuardianMutation = useMutation({
    mutationFn: async (guardianData: Partial<GuardianType>) => {
      const response = await apiRequest('POST', '/api/guardians', {
        body: guardianData
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      toast({
        title: "Succes",
        description: "Voogd is succesvol toegevoegd.",
      });
      setShowNewGuardianDialog(false);
      resetNewGuardianForm();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de voogd.",
        variant: "destructive",
      });
    }
  });

  // Handle voogd updaten
  const updateGuardianMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<GuardianType> }) => {
      const response = await apiRequest('PUT', `/api/guardians/${id}`, {
        body: data
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      toast({
        title: "Succes",
        description: "Voogd is succesvol bijgewerkt.",
      });
      setIsEditDialogOpen(false);
      setSelectedGuardian(null);
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van de voogd.",
        variant: "destructive",
      });
    }
  });

  // Handle voogd verwijderen
  const deleteGuardianMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/guardians/${id}`, {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      toast({
        title: "Succes",
        description: "Voogd is succesvol verwijderd.",
      });
      setShowDeleteDialog(false);
      setSelectedGuardian(null);
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van de voogd.",
        variant: "destructive",
      });
    }
  });

  const handleCreateGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    setHasValidationAttempt(true);
    
    if (!validateGuardianForm(newGuardian)) {
      toast({
        title: "Validatiefout",
        description: "Vul alle verplichte velden in.",
        variant: "destructive",
      });
      return;
    }

    createGuardianMutation.mutate(newGuardian);
  };

  const handleUpdateGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGuardian || !validateGuardianForm(editFormData)) {
      toast({
        title: "Validatiefout",
        description: "Vul alle verplichte velden in.",
        variant: "destructive",
      });
      return;
    }

    updateGuardianMutation.mutate({ 
      id: selectedGuardian.id, 
      data: editFormData 
    });
  };

  const handleDeleteGuardian = () => {
    if (selectedGuardian) {
      deleteGuardianMutation.mutate(selectedGuardian.id);
    }
  };

  const handleViewGuardian = (guardian: GuardianType) => {
    setSelectedGuardian(guardian);
    setIsViewDialogOpen(true);
  };

  const handleEditGuardian = (guardian: GuardianType) => {
    setSelectedGuardian(guardian);
    setEditFormData({
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      relationship: guardian.relationship,
      relationshipOther: guardian.relationshipOther,
      email: guardian.email,
      phone: guardian.phone,
      isEmergencyContact: guardian.isEmergencyContact,
      emergencyContactFirstName: guardian.emergencyContactFirstName,
      emergencyContactLastName: guardian.emergencyContactLastName,
      emergencyContactPhone: guardian.emergencyContactPhone,
      emergencyContactRelationship: guardian.emergencyContactRelationship
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (guardian: GuardianType) => {
    setSelectedGuardian(guardian);
    setShowDeleteDialog(true);
  };

  // Export functionaliteit
  const handleExport = () => {
    setIsExportDialogOpen(true);
  };

  const handleConfirmExport = () => {
    const headers = ['Voornaam', 'Achternaam', 'Relatie', 'Email', 'Telefoon', 'Noodcontact'];
    const csvData = filteredGuardians.map((guardian: GuardianType) => [
      guardian.firstName,
      guardian.lastName,
      guardian.relationship === 'other' ? guardian.relationshipOther : guardian.relationship,
      guardian.email,
      guardian.phone || '',
      guardian.isEmergencyContact ? 'Ja' : 'Nee'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `voogden_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    setIsExportDialogOpen(false);
    toast({
      title: "Export voltooid",
      description: "Voogden zijn geëxporteerd naar CSV bestand.",
    });
  };

  const getRelationshipDisplay = (relationship: string, relationshipOther?: string) => {
    const relationships: { [key: string]: string } = {
      parent: 'Ouder',
      guardian: 'Voogd',
      grandparent: 'Grootouder',
      sibling: 'Broer/Zus',
      other: relationshipOther || 'Anders'
    };
    return relationships[relationship] || relationship;
  };

  if (isLoading) {
    return (
      <div className="bg-[#f7f9fc] min-h-screen">
        <PremiumHeader
          icon={UserCheck}
          title="Voogdenbeheer"
          subtitle="Beheer alle voogden en hun contactinformatie"
          parentLabel="Secretariaat"
          currentLabel="Voogden"
        />
        <div className="px-6 py-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-[#f7f9fc] min-h-screen">
        <PremiumHeader
          icon={UserCheck}
          title="Voogdenbeheer"
          subtitle="Beheer alle voogden en hun contactinformatie"
          parentLabel="Secretariaat"
          currentLabel="Voogden"
        />
        <div className="px-6 py-6 max-w-7xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Er is een fout opgetreden</h3>
            <p className="mt-1 text-sm text-gray-500">Probeer de pagina te vernieuwen.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      {/* Premium Header */}
      <PremiumHeader
        icon={<UserCheck className="h-5 w-5 text-white" />}
        title="Voogdenbeheer"
        subtitle="Beheer alle voogden en hun contactinformatie"
        parentLabel="Secretariaat"
        currentLabel="Voogden"
      />

      {/* Main Content */}
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        
        {/* Action Bar */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Zoek voogden op naam, email of telefoon..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <ExportButton onClick={handleExport} />
                <Button
                  onClick={() => setShowNewGuardianDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nieuwe Voogd
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Voogden ({filteredGuardians.length})
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Beheer alle geregistreerde voogden en contactpersonen
                </p>
              </div>
              
              {selectedGuardians.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {selectedGuardians.length} geselecteerd
                  </span>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Verwijderen
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {filteredGuardians.length === 0 ? (
              <EmptyState
                icon={UserCheck}
                title="Geen voogden gevonden"
                description="Er zijn geen voogden die voldoen aan de huidige zoekcriteria."
                action={{
                  label: "Nieuwe Voogd Toevoegen",
                  onClick: () => setShowNewGuardianDialog(true)
                }}
              />
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Checkbox
                        checked={selectedGuardians.length === filteredGuardians.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedGuardians(filteredGuardians.map((g: GuardianType) => g.id));
                          } else {
                            setSelectedGuardians([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voogd
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Relatie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Noodcontact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGuardians.map((guardian: GuardianType) => (
                    <tr key={guardian.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={selectedGuardians.includes(guardian.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedGuardians([...selectedGuardians, guardian.id]);
                            } else {
                              setSelectedGuardians(selectedGuardians.filter(id => id !== guardian.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {guardian.firstName?.[0]}{guardian.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {guardian.firstName} {guardian.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary">
                          {getRelationshipDisplay(guardian.relationship, guardian.relationshipOther)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {guardian.email}
                          </div>
                          {guardian.phone && (
                            <div className="flex items-center mt-1 text-gray-500">
                              <Phone className="h-3 w-3 mr-1" />
                              {guardian.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {guardian.isEmergencyContact ? (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Noodcontact
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewGuardian(guardian)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Bekijken</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditGuardian(guardian)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Bewerken</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(guardian)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Verwijderen</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create Guardian Dialog */}
      <CustomDialog open={showNewGuardianDialog} onOpenChange={setShowNewGuardianDialog} className="max-w-4xl">
        <DialogHeaderWithIcon
          icon={<UserPlus className="h-5 w-5 text-blue-600" />}
          title="Nieuwe Voogd Toevoegen"
          description="Voeg een nieuwe voogd toe aan het systeem"
        />
        
        <DialogFormContainer>
          <form onSubmit={handleCreateGuardian}>
            <Tabs defaultValue="gegevens" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="gegevens" className="flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Gegevens</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  <span>Noodcontact</span>
                </TabsTrigger>
                <TabsTrigger value="students" className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  <span>Studenten</span>
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

              <TabsContent value="students" className="space-y-4 min-h-[300px]">
                <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                  <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Gekoppelde Studenten
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Zoek studenten..."
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                        className="pl-10 h-8 text-sm"
                      />
                    </div>
                    
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {students
                        .filter((student: any) => 
                          student.firstName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                          student.lastName.toLowerCase().includes(studentSearchTerm.toLowerCase())
                        )
                        .map((student: any) => (
                          <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                            <Checkbox
                              checked={newGuardian.linkedStudents?.includes(student.id) || false}
                              onCheckedChange={(checked) => {
                                const currentLinked = newGuardian.linkedStudents || [];
                                if (checked) {
                                  setNewGuardian({
                                    ...newGuardian,
                                    linkedStudents: [...currentLinked, student.id]
                                  });
                                } else {
                                  setNewGuardian({
                                    ...newGuardian,
                                    linkedStudents: currentLinked.filter(id => id !== student.id)
                                  });
                                }
                              }}
                            />
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                {student.firstName[0]}{student.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{student.firstName} {student.lastName}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </DialogFormContainer>

        <DialogFooterContainer>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setShowNewGuardianDialog(false);
              resetNewGuardianForm();
            }}
          >
            Annuleren
          </Button>
          <Button 
            type="submit"
            onClick={handleCreateGuardian}
            disabled={createGuardianMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {createGuardianMutation.isPending ? 'Bezig...' : 'Voogd Toevoegen'}
          </Button>
        </DialogFooterContainer>
      </CustomDialog>

      {/* View Guardian Dialog */}
      <CustomDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} className="max-w-2xl">
        <DialogHeaderWithIcon
          icon={<Eye className="h-5 w-5 text-blue-600" />}
          title="Voogd Details"
          description={selectedGuardian ? `Details van ${selectedGuardian.firstName} ${selectedGuardian.lastName}` : ""}
        />
        
        {selectedGuardian && (
          <DialogFormContainer>
            <div className="space-y-6">
              <SectionContainer title="Persoonlijke Informatie">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Naam</Label>
                    <p className="text-sm text-gray-900 mt-1">{selectedGuardian.firstName} {selectedGuardian.lastName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Relatie</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {getRelationshipDisplay(selectedGuardian.relationship, selectedGuardian.relationshipOther)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="text-sm text-gray-900 mt-1">{selectedGuardian.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Telefoon</Label>
                    <p className="text-sm text-gray-900 mt-1">{selectedGuardian.phone || 'Niet opgegeven'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Noodcontact</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedGuardian.isEmergencyContact ? 'Ja' : 'Nee'}
                    </p>
                  </div>
                </div>
              </SectionContainer>

              {(selectedGuardian.emergencyContactFirstName || selectedGuardian.emergencyContactPhone) && (
                <SectionContainer title="Noodcontact Informatie">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Naam</Label>
                      <p className="text-sm text-gray-900 mt-1">
                        {selectedGuardian.emergencyContactFirstName} {selectedGuardian.emergencyContactLastName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Telefoon</Label>
                      <p className="text-sm text-gray-900 mt-1">{selectedGuardian.emergencyContactPhone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Relatie</Label>
                      <p className="text-sm text-gray-900 mt-1">
                        {getRelationshipDisplay(selectedGuardian.emergencyContactRelationship || '')}
                      </p>
                    </div>
                  </div>
                </SectionContainer>
              )}
            </div>
          </DialogFormContainer>
        )}

        <DialogFooterContainer>
          <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
            Sluiten
          </Button>
          {selectedGuardian && (
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              handleEditGuardian(selectedGuardian);
            }}>
              <Pencil className="h-4 w-4 mr-2" />
              Bewerken
            </Button>
          )}
        </DialogFooterContainer>
      </CustomDialog>

      {/* Edit Guardian Dialog */}
      <CustomDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} className="max-w-2xl">
        <DialogHeaderWithIcon
          icon={<Pencil className="h-5 w-5 text-blue-600" />}
          title="Voogd Bewerken"
          description={selectedGuardian ? `Bewerk gegevens van ${selectedGuardian.firstName} ${selectedGuardian.lastName}` : ""}
        />
        
        <DialogFormContainer>
          <form onSubmit={handleUpdateGuardian} className="space-y-6">
            <SectionContainer title="Persoonlijke Informatie">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName">Voornaam *</Label>
                  <Input
                    id="editFirstName"
                    value={editFormData.firstName || ''}
                    onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Achternaam *</Label>
                  <Input
                    id="editLastName"
                    value={editFormData.lastName || ''}
                    onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editPhone">Telefoon</Label>
                  <Input
                    id="editPhone"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editRelationship">Relatie *</Label>
                  <Select 
                    value={editFormData.relationship} 
                    onValueChange={(value) => setEditFormData({...editFormData, relationship: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een relatie" />
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
                {editFormData.relationship === 'other' && (
                  <div>
                    <Label htmlFor="editRelationshipOther">Specificeer relatie *</Label>
                    <Input
                      id="editRelationshipOther"
                      value={editFormData.relationshipOther || ''}
                      onChange={(e) => setEditFormData({...editFormData, relationshipOther: e.target.value})}
                      required
                    />
                  </div>
                )}
                <div className="col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={editFormData.isEmergencyContact || false}
                      onCheckedChange={(checked) => 
                        setEditFormData({...editFormData, isEmergencyContact: checked === true})
                      }
                    />
                    <Label>Deze persoon is een noodcontact</Label>
                  </div>
                </div>
              </div>
            </SectionContainer>

            <SectionContainer title="Noodcontact Informatie">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editEmergencyFirstName">Voornaam</Label>
                  <Input
                    id="editEmergencyFirstName"
                    value={editFormData.emergencyContactFirstName || ''}
                    onChange={(e) => setEditFormData({...editFormData, emergencyContactFirstName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editEmergencyLastName">Achternaam</Label>
                  <Input
                    id="editEmergencyLastName"
                    value={editFormData.emergencyContactLastName || ''}
                    onChange={(e) => setEditFormData({...editFormData, emergencyContactLastName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editEmergencyPhone">Telefoon</Label>
                  <Input
                    id="editEmergencyPhone"
                    value={editFormData.emergencyContactPhone || ''}
                    onChange={(e) => setEditFormData({...editFormData, emergencyContactPhone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="editEmergencyRelationship">Relatie</Label>
                  <Select 
                    value={editFormData.emergencyContactRelationship || ''} 
                    onValueChange={(value) => setEditFormData({...editFormData, emergencyContactRelationship: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een relatie" />
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
              </div>
            </SectionContainer>
          </form>
        </DialogFormContainer>

        <DialogFooterContainer>
          <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
            Annuleren
          </Button>
          <Button 
            type="submit"
            onClick={handleUpdateGuardian}
            disabled={updateGuardianMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateGuardianMutation.isPending ? 'Bezig...' : 'Wijzigingen Opslaan'}
          </Button>
        </DialogFooterContainer>
      </CustomDialog>

      {/* Delete Dialog */}
      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteGuardian}
        title="Voogd Verwijderen"
        description={
          selectedGuardian 
            ? `Weet je zeker dat je ${selectedGuardian.firstName} ${selectedGuardian.lastName} wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`
            : ""
        }
        confirmText="Verwijderen"
        cancelText="Annuleren"
      />

      {/* Export Dialog */}
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        onConfirm={handleConfirmExport}
        title="Voogden Exporteren"
        description={`Exporteer ${filteredGuardians.length} voogden naar een CSV bestand.`}
      />
    </div>
  );
}