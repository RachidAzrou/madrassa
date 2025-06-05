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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Type definities - exact copy from admin
type GuardianType = {
  id: number;
  firstName: string;
  lastName: string;
  relationship: string;
  relationshipOther?: string;
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

// Admin-style components
const DataTableContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-sm overflow-hidden">
    {children}
  </div>
);

const SearchActionBar = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4 py-3 border-b border-[#e5e7eb] flex flex-wrap items-center justify-between gap-3">
    {children}
  </div>
);

const TableContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-x-auto">
    {children}
  </div>
);

const QuickActions = ({ onView, onEdit, onDelete }: { onView: () => void, onEdit: () => void, onDelete: () => void }) => (
  <div className="flex items-center gap-1">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onView}>
            <Eye className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bekijken</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onEdit}>
            <Pencil className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bewerken</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Verwijderen</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

export default function Guardians() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State variables - exact copy from admin
  const [searchTerm, setSearchTerm] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('all');
  const [emergencyContactFilter, setEmergencyContactFilter] = useState('all');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianType | null>(null);

  // Form data - exact copy from admin
  const emptyFormData = {
    firstName: "",
    lastName: "",
    relationship: "parent",
    relationshipOther: "",
    email: "",
    phone: "",
    address: "",
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    isEmergencyContact: false,
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    notes: "",
    occupation: ""
  };

  const [formData, setFormData] = useState(emptyFormData);
  const [editFormData, setEditFormData] = useState(emptyFormData);

  // Data fetching
  const { data: guardians = [], isLoading, isError } = useQuery({
    queryKey: ['/api/guardians'],
    staleTime: 60000,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['/api/students'],
    staleTime: 60000,
  });

  // Filter guardians
  const filteredGuardians = guardians.filter((guardian: GuardianType) => {
    const matchesSearch = searchTerm === '' || 
      guardian.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guardian.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guardian.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRelationship = relationshipFilter === 'all' || guardian.relationship === relationshipFilter;
    const matchesEmergencyContact = emergencyContactFilter === 'all' || 
      (emergencyContactFilter === 'yes' && guardian.isEmergencyContact) ||
      (emergencyContactFilter === 'no' && !guardian.isEmergencyContact);
    
    return matchesSearch && matchesRelationship && matchesEmergencyContact;
  });

  // Helper functions
  const resetForm = () => {
    setFormData(emptyFormData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Mutations
  const createGuardianMutation = useMutation({
    mutationFn: async (guardianData: any) => {
      const response = await apiRequest('POST', '/api/guardians', guardianData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Voogd toegevoegd",
        description: "De nieuwe voogd is succesvol toegevoegd.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de voogd.",
        variant: "destructive",
      });
    },
  });

  const updateGuardianMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await apiRequest('PUT', `/api/guardians/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      setIsEditDialogOpen(false);
      setSelectedGuardian(null);
      toast({
        title: "Voogd bijgewerkt",
        description: "De voogd is succesvol bijgewerkt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van de voogd.",
        variant: "destructive",
      });
    },
  });

  const deleteGuardianMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/guardians/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      setIsDeleteDialogOpen(false);
      setSelectedGuardian(null);
      toast({
        title: "Voogd verwijderd",
        description: "De voogd is succesvol verwijderd.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van de voogd.",
        variant: "destructive",
      });
    },
  });

  const handleCreateGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Validatiefout",
        description: "Vul alle verplichte velden in.",
        variant: "destructive",
      });
      return;
    }

    createGuardianMutation.mutate(formData);
  };

  const handleEditGuardian = (guardian: GuardianType) => {
    setSelectedGuardian(guardian);
    setEditFormData({
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      relationship: guardian.relationship,
      relationshipOther: guardian.relationshipOther || "",
      email: guardian.email,
      phone: guardian.phone || "",
      address: guardian.address || "",
      street: guardian.street || "",
      houseNumber: guardian.houseNumber || "",
      postalCode: guardian.postalCode || "",
      city: guardian.city || "",
      isEmergencyContact: guardian.isEmergencyContact,
      emergencyContactName: guardian.emergencyContactName || "",
      emergencyContactPhone: guardian.emergencyContactPhone || "",
      emergencyContactRelation: guardian.emergencyContactRelation || "",
      notes: guardian.notes || "",
      occupation: guardian.occupation || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedGuardian) {
      updateGuardianMutation.mutate({
        id: selectedGuardian.id,
        data: editFormData
      });
    }
  };

  const handleViewGuardian = (guardian: GuardianType) => {
    setSelectedGuardian(guardian);
    setIsViewDialogOpen(true);
  };

  const handleDeleteGuardian = (guardian: GuardianType) => {
    setSelectedGuardian(guardian);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteGuardian = () => {
    if (selectedGuardian) {
      deleteGuardianMutation.mutate(selectedGuardian.id);
    }
  };

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      <PremiumHeader 
        title="Voogden" 
        description="Bekijk en beheer alle voogden en noodcontacten van studenten"
        icon={Users}
        breadcrumbs={{
          parent: "Secretariaat",
          current: "Voogden"
        }}
      />
      
      <DataTableContainer>
        <SearchActionBar>
          {/* Zoekbalk */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Zoek op naam of email..."
              className="w-full pl-9 h-8 text-xs rounded-sm bg-white border-[#e5e7eb]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Acties */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterOptions(!showFilterOptions)}
              className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
              title="Filters"
            >
              <Filter className="h-3.5 w-3.5" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportDialogOpen(true)}
              className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
              title="Importeer voogden"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExportDialogOpen(true)}
              className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
              title="Exporteer voogden"
            >
              <FileDown className="h-3.5 w-3.5" />
            </Button>

            <Button
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
              className="h-7 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white ml-auto"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              Nieuwe Voogd
            </Button>
          </div>
        </SearchActionBar>

        {/* Filter opties */}
        {showFilterOptions && (
          <div className="px-4 py-3 border-t border-[#e5e7eb] flex flex-wrap gap-3 items-center">
            <div className="flex items-center">
              {(relationshipFilter !== 'all' || emergencyContactFilter !== 'all') && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setRelationshipFilter('all');
                    setEmergencyContactFilter('all');
                  }}
                  className="h-7 text-xs text-blue-600 p-0 mr-3"
                >
                  Filters wissen
                </Button>
              )}
            </div>
            
            <Select value={relationshipFilter} onValueChange={setRelationshipFilter}>
              <SelectTrigger className="h-7 w-32 text-xs rounded-sm border-[#e5e7eb]">
                <SelectValue placeholder="Relatie" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#e5e7eb]">
                <SelectItem value="all" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Alle relaties</SelectItem>
                <SelectItem value="parent" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Ouder</SelectItem>
                <SelectItem value="guardian" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Voogd</SelectItem>
                <SelectItem value="grandparent" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Grootouder</SelectItem>
                <SelectItem value="other" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Anders</SelectItem>
              </SelectContent>
            </Select>

            <Select value={emergencyContactFilter} onValueChange={setEmergencyContactFilter}>
              <SelectTrigger className="h-7 w-36 text-xs rounded-sm border-[#e5e7eb]">
                <SelectValue placeholder="Noodcontact" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#e5e7eb]">
                <SelectItem value="all" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Alle contacten</SelectItem>
                <SelectItem value="yes" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Noodcontact</SelectItem>
                <SelectItem value="no" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Geen noodcontact</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tabel */}
        <TableContainer>
          <Table>
            <TableHeader className="bg-[#f9fafb]">
              <TableRow>
                <TableHead className="w-12 px-4 py-3">
                  <Checkbox />
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Voogd</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Relatie</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Contact</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Studenten</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Noodcontact</TableHead>
                <TableHead className="w-20 px-4 py-3 text-xs font-medium text-gray-700 text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span className="ml-2 text-gray-600">Laden...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredGuardians.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <EmptyState
                      icon={Users}
                      title="Geen voogden gevonden"
                      description="Er zijn geen voogden die voldoen aan de huidige criteria."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredGuardians.map((guardian: GuardianType) => (
                  <TableRow key={guardian.id} className="hover:bg-gray-50">
                    <TableCell className="px-4 py-3">
                      <Checkbox />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {guardian.firstName?.[0]}{guardian.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-medium text-gray-900">{guardian.firstName} {guardian.lastName}</p>
                          <p className="text-xs text-gray-500">{guardian.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {guardian.relationship === 'parent' && 'Ouder'}
                        {guardian.relationship === 'guardian' && 'Voogd'}
                        {guardian.relationship === 'grandparent' && 'Grootouder'}
                        {guardian.relationship === 'other' && (guardian.relationshipOther || 'Anders')}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600">
                      {guardian.phone || '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600">
                      {students
                        .filter((student: StudentType) => 
                          // Filter logic zou hier komen voor gekoppelde studenten
                          false
                        )
                        .map((student: StudentType) => (
                          <span key={student.id} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                            {student.firstName} {student.lastName}
                          </span>
                        ))
                      }
                      {students.filter((student: StudentType) => false).length === 0 && '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {guardian.isEmergencyContact ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <HeartPulse className="h-3 w-3 mr-1" />
                          Noodcontact
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <QuickActions
                        onView={() => handleViewGuardian(guardian)}
                        onEdit={() => handleEditGuardian(guardian)}
                        onDelete={() => handleDeleteGuardian(guardian)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DataTableContainer>

      {/* Create Guardian Dialog - Complete Admin Copy */}
      <Dialog 
        open={isCreateDialogOpen} 
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Nieuwe Voogd Toevoegen
            </DialogTitle>
            <DialogDescription>
              Voeg een nieuwe voogd toe aan het systeem
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateGuardian} className="space-y-6">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Persoonlijk</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="emergency">Noodcontact</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName">Voornaam *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      placeholder="Voornaam"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Achternaam *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      placeholder="Achternaam"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="relationship">Relatie tot student *</Label>
                    <Select 
                      value={formData.relationship} 
                      onValueChange={(value) => handleSelectChange('relationship', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer relatie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Ouder</SelectItem>
                        <SelectItem value="guardian">Voogd</SelectItem>
                        <SelectItem value="grandparent">Grootouder</SelectItem>
                        <SelectItem value="other">Anders</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.relationship === 'other' && (
                    <div className="col-span-2">
                      <Label htmlFor="relationshipOther">Specificeer relatie</Label>
                      <Input
                        id="relationshipOther"
                        name="relationshipOther"
                        value={formData.relationshipOther}
                        onChange={handleInputChange}
                        placeholder="Specificeer de relatie"
                      />
                    </div>
                  )}
                  <div className="col-span-2">
                    <Label htmlFor="occupation">Beroep</Label>
                    <Input
                      id="occupation"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      placeholder="Beroep"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefoon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="06-12345678"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor="street">Straat</Label>
                      <Input
                        id="street"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        placeholder="Straatnaam"
                      />
                    </div>
                    <div>
                      <Label htmlFor="houseNumber">Huisnummer</Label>
                      <Input
                        id="houseNumber"
                        name="houseNumber"
                        value={formData.houseNumber}
                        onChange={handleInputChange}
                        placeholder="Nr."
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="postalCode">Postcode</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        placeholder="1234AB"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Plaats</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Plaatsnaam"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="emergency" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isEmergencyContact"
                      checked={formData.isEmergencyContact}
                      onCheckedChange={(checked) => handleCheckboxChange('isEmergencyContact', checked as boolean)}
                    />
                    <Label htmlFor="isEmergencyContact">
                      Deze persoon is een noodcontact
                    </Label>
                  </div>
                  
                  {formData.isEmergencyContact && (
                    <div className="space-y-3 p-4 bg-red-50 rounded-md border border-red-200">
                      <div>
                        <Label htmlFor="emergencyContactName">Noodcontact naam</Label>
                        <Input
                          id="emergencyContactName"
                          name="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={handleInputChange}
                          placeholder="Volledige naam"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactPhone">Noodcontact telefoon</Label>
                        <Input
                          id="emergencyContactPhone"
                          name="emergencyContactPhone"
                          value={formData.emergencyContactPhone}
                          onChange={handleInputChange}
                          placeholder="06-12345678"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emergencyContactRelation">Relatie tot student</Label>
                        <Input
                          id="emergencyContactRelation"
                          name="emergencyContactRelation"
                          value={formData.emergencyContactRelation}
                          onChange={handleInputChange}
                          placeholder="Bijv. Ouder, Oma, etc."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                disabled={createGuardianMutation.isPending}
                className="bg-[#1e40af] hover:bg-[#1d3a9e] text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {createGuardianMutation.isPending ? 'Voogd toevoegen...' : 'Voogd toevoegen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Voogd verwijderen
            </DialogTitle>
            <DialogDescription>
              Weet je zeker dat je {selectedGuardian?.firstName} {selectedGuardian?.lastName} wilt verwijderen? 
              Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteGuardian}
              disabled={deleteGuardianMutation.isPending}
            >
              {deleteGuardianMutation.isPending ? 'Verwijderen...' : 'Verwijderen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}