import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/useRBAC";
import { 
  AdminPageLayout,
  AdminPageHeader,
  AdminStatsGrid,
  AdminStatCard,
  AdminActionButton,
  AdminSearchBar,
  AdminTableCard,
  AdminFilterSelect,
  AdminAvatar
} from "@/components/ui/admin-layout";
import {
  Users,
  UserPlus,
  UserCheck,
  Shield,
  Download,
  Upload,
  Mail,
  Phone,
  MapPin,
  Eye,
  Edit,
  Trash2
} from "lucide-react";

// Define RESOURCES locally
const RESOURCES = {
  GUARDIANS: 'guardians',
  STUDENTS: 'students'
} as const;

interface Guardian {
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
}

interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  status?: string;
}

const guardianFormSchema = z.object({
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  relationship: z.string().min(1, "Relatie is verplicht"),
  email: z.string().email("Ongeldig email adres"),
  phone: z.string().optional(),
  street: z.string().optional(),
  houseNumber: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  isEmergencyContact: z.boolean().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  notes: z.string().optional(),
  occupation: z.string().optional(),
});

type GuardianFormData = z.infer<typeof guardianFormSchema>;

export default function Guardians() {
  const [searchTerm, setSearchTerm] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState("all");
  const [emergencyContactFilter, setEmergencyContactFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedGuardian, setSelectedGuardian] = useState<Guardian | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreate, canUpdate, canDelete } = useRBAC();

  const form = useForm<GuardianFormData>({
    resolver: zodResolver(guardianFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      relationship: "",
      email: "",
      phone: "",
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      isEmergencyContact: false,
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
      notes: "",
      occupation: "",
    },
  });

  const { data: guardians = [], isLoading: guardiansLoading } = useQuery<Guardian[]>({
    queryKey: ["/api/guardians"],
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const createGuardianMutation = useMutation({
    mutationFn: async (data: GuardianFormData) => {
      const response = await apiRequest("POST", "/api/guardians", { body: data });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guardians"] });
      toast({ title: "Voogd succesvol toegevoegd" });
      setShowDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen voogd",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateGuardianMutation = useMutation({
    mutationFn: async (data: GuardianFormData) => {
      const response = await apiRequest("PUT", `/api/guardians/${selectedGuardian?.id}`, { body: data });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guardians"] });
      toast({ title: "Voogd succesvol bijgewerkt" });
      setShowDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken voogd",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteGuardianMutation = useMutation({
    mutationFn: async (guardianId: number) => {
      await apiRequest("DELETE", `/api/guardians/${guardianId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guardians"] });
      toast({ title: "Voogd succesvol verwijderd" });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen voogd",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredGuardians = guardians.filter((guardian: Guardian) => {
    const matchesSearch = 
      guardian.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guardian.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guardian.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRelationship = relationshipFilter === "all" || guardian.relationship === relationshipFilter;
    const matchesEmergencyContact = emergencyContactFilter === "all" || 
      (emergencyContactFilter === "yes" && guardian.isEmergencyContact) ||
      (emergencyContactFilter === "no" && !guardian.isEmergencyContact);
    
    return matchesSearch && matchesRelationship && matchesEmergencyContact;
  });

  const handleCreateGuardian = () => {
    setDialogMode('create');
    setSelectedGuardian(null);
    form.reset();
    setShowDialog(true);
  };

  const handleViewGuardian = (guardian: Guardian) => {
    setDialogMode('view');
    setSelectedGuardian(guardian);
    setShowDialog(true);
  };

  const handleEditGuardian = (guardian: Guardian) => {
    setDialogMode('edit');
    setSelectedGuardian(guardian);
    form.reset({
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      relationship: guardian.relationship,
      email: guardian.email,
      phone: guardian.phone || "",
      street: guardian.street || "",
      houseNumber: guardian.houseNumber || "",
      postalCode: guardian.postalCode || "",
      city: guardian.city || "",
      isEmergencyContact: guardian.isEmergencyContact,
      emergencyContactName: guardian.emergencyContactName || "",
      emergencyContactPhone: guardian.emergencyContactPhone || "",
      emergencyContactRelation: guardian.emergencyContactRelation || "",
      notes: guardian.notes || "",
      occupation: guardian.occupation || "",
    });
    setShowDialog(true);
  };

  const handleDeleteGuardian = (guardian: Guardian) => {
    if (window.confirm(`Weet je zeker dat je ${guardian.firstName} ${guardian.lastName} wilt verwijderen?`)) {
      deleteGuardianMutation.mutate(guardian.id);
    }
  };

  const onSubmit = (data: GuardianFormData) => {
    if (dialogMode === 'create') {
      createGuardianMutation.mutate(data);
    } else if (dialogMode === 'edit') {
      updateGuardianMutation.mutate(data);
    }
  };

  const getRelationshipOptions = () => {
    const relationships = [...new Set(guardians.map(g => g.relationship))];
    return relationships.map(rel => ({ value: rel, label: rel }));
  };

  if (guardiansLoading || studentsLoading) {
    return (
      <AdminPageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout>
      <AdminPageHeader 
        title="Voogden" 
        description="Beheer voogden en noodcontactpersonen"
      >
        <AdminActionButton variant="outline" icon={<Download className="w-4 h-4" />}>
          Exporteren
        </AdminActionButton>
        <AdminActionButton variant="outline" icon={<Upload className="w-4 h-4" />}>
          Importeren
        </AdminActionButton>
        {canCreate(RESOURCES.GUARDIANS) && (
          <AdminActionButton 
            icon={<UserPlus className="w-4 h-4" />}
            onClick={handleCreateGuardian}
          >
            Nieuwe Voogd
          </AdminActionButton>
        )}
      </AdminPageHeader>

      <AdminStatsGrid columns={4}>
        <AdminStatCard
          title="Totaal Voogden"
          value={guardians.length}
          subtitle="Alle voogden"
          icon={<Users className="h-4 w-4" />}
        />
        <AdminStatCard
          title="Noodcontacten"
          value={guardians.filter(g => g.isEmergencyContact).length}
          subtitle="Emergency contacten"
          valueColor="text-blue-600"
          icon={<Shield className="h-4 w-4" />}
        />
        <AdminStatCard
          title="Ouders"
          value={guardians.filter(g => g.relationship === 'Ouder').length}
          subtitle="Ouderlijk gezag"
          valueColor="text-green-600"
          icon={<UserCheck className="h-4 w-4" />}
        />
        <AdminStatCard
          title="Studenten"
          value={students.length}
          subtitle="Onder toezicht"
          valueColor="text-blue-600"
          icon={<Users className="h-4 w-4" />}
        />
      </AdminStatsGrid>

      <AdminSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Zoek op naam of email..."
        filters={
          <>
            <AdminFilterSelect
              value={relationshipFilter}
              onValueChange={setRelationshipFilter}
              placeholder="Relatie filter"
              options={[
                { value: "all", label: "Alle relaties" },
                ...getRelationshipOptions()
              ]}
            />
            <AdminFilterSelect
              value={emergencyContactFilter}
              onValueChange={setEmergencyContactFilter}
              placeholder="Noodcontact filter"
              options={[
                { value: "all", label: "Alle contacten" },
                { value: "yes", label: "Noodcontacten" },
                { value: "no", label: "Reguliere contacten" }
              ]}
            />
          </>
        }
      />

      <AdminTableCard 
        title={`Voogden (${filteredGuardians.length})`}
        subtitle="Beheer alle geregistreerde voogden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Voogd</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Relatie</TableHead>
              <TableHead>Adres</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGuardians.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  Geen voogden gevonden
                </TableCell>
              </TableRow>
            ) : (
              filteredGuardians.map((guardian: Guardian) => (
                <TableRow key={guardian.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <AdminAvatar initials={`${guardian.firstName[0]}${guardian.lastName[0]}`} />
                      <div>
                        <div className="font-medium">{guardian.firstName} {guardian.lastName}</div>
                        {guardian.occupation && (
                          <div className="text-sm text-gray-500">{guardian.occupation}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        {guardian.email}
                      </div>
                      {guardian.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          {guardian.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{guardian.relationship}</Badge>
                  </TableCell>
                  <TableCell>
                    {guardian.street && guardian.city ? (
                      <div className="flex items-center text-sm">
                        <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div>{guardian.street} {guardian.houseNumber}</div>
                          <div className="text-gray-500">{guardian.postalCode} {guardian.city}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Geen adres</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {guardian.isEmergencyContact ? (
                      <Badge className="bg-blue-100 text-blue-800">Noodcontact</Badge>
                    ) : (
                      <Badge variant="outline">Regulier</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewGuardian(guardian)}
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canUpdate(RESOURCES.GUARDIANS) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditGuardian(guardian)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete(RESOURCES.GUARDIANS) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGuardian(guardian)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableCard>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' && 'Nieuwe Voogd Toevoegen'}
              {dialogMode === 'edit' && 'Voogd Bewerken'}
              {dialogMode === 'view' && 'Voogd Details'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogMode === 'view' && selectedGuardian ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Naam</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedGuardian.firstName} {selectedGuardian.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Relatie</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedGuardian.relationship}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedGuardian.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Telefoon</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedGuardian.phone || 'Niet opgegeven'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Adres</Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedGuardian.street && selectedGuardian.city ? 
                      `${selectedGuardian.street} ${selectedGuardian.houseNumber}, ${selectedGuardian.postalCode} ${selectedGuardian.city}` : 
                      'Niet opgegeven'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Noodcontact</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedGuardian.isEmergencyContact ? 'Ja' : 'Nee'}</p>
                </div>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voornaam</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Achternaam</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relatie</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer relatie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Ouder">Ouder</SelectItem>
                            <SelectItem value="Voogd">Voogd</SelectItem>
                            <SelectItem value="Grootouder">Grootouder</SelectItem>
                            <SelectItem value="Familie">Familie</SelectItem>
                            <SelectItem value="Overig">Overig</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefoon</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beroep</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Annuleren
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createGuardianMutation.isPending || updateGuardianMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    {dialogMode === 'create' ? 'Voogd Toevoegen' : 'Wijzigingen Opslaan'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}