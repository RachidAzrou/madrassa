import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/useRBAC";
import {
  Users,
  UserPlus,
  UserCheck,
  Shield,
  Phone,
  Mail,
  MapPin,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Search,
  AlertTriangle
} from "lucide-react";

const RESOURCES = {
  GUARDIANS: 'guardians'
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
  isEmergencyContact: z.boolean().default(false),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  occupation: z.string().optional(),
  notes: z.string().optional(),
});

type GuardianFormData = z.infer<typeof guardianFormSchema>;

export default function Guardians() {
  const [searchTerm, setSearchTerm] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState("all");
  const [emergencyFilter, setEmergencyFilter] = useState("all");
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
      occupation: "",
      notes: "",
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
      const response = await apiRequest("POST", "/api/guardians", data);
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
      const response = await apiRequest("PUT", `/api/guardians/${selectedGuardian?.id}`, data);
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
    const matchesEmergency = emergencyFilter === "all" || 
      (emergencyFilter === "yes" && guardian.isEmergencyContact) ||
      (emergencyFilter === "no" && !guardian.isEmergencyContact);
    
    return matchesSearch && matchesRelationship && matchesEmergency;
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
      occupation: guardian.occupation || "",
      notes: guardian.notes || "",
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

  const getStudentsForGuardian = (guardianId: number) => {
    return students.filter((student: Student) => 
      student.guardianId === guardianId
    );
  };

  if (guardiansLoading || studentsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  const totalGuardians = guardians.length;
  const emergencyContacts = guardians.filter(g => g.isEmergencyContact).length;
  const parentsCount = guardians.filter(g => g.relationship === 'Ouder').length;
  const guardiansCount = guardians.filter(g => g.relationship === 'Voogd').length;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Voogdenbeheer</h1>
          <p className="text-gray-600 mt-2">Beheer alle voogden en hun contactinformatie</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="border-gray-300 bg-white hover:bg-gray-50">
            <Download className="w-4 h-4 mr-2" />
            Exporteren
          </Button>
          <Button variant="outline" className="border-gray-300 bg-white hover:bg-gray-50">
            <Upload className="w-4 h-4 mr-2" />
            Importeren
          </Button>
          {canCreate(RESOURCES.GUARDIANS) && (
            <Button 
              onClick={handleCreateGuardian}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Nieuwe Voogd
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Totaal Voogden</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalGuardians}</div>
            <p className="text-xs text-gray-500">Alle voogden</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Noodcontacten</CardTitle>
              <AlertTriangle className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{emergencyContacts}</div>
            <p className="text-xs text-gray-500">Geregistreerde noodcontacten</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Ouders</CardTitle>
              <UserCheck className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{parentsCount}</div>
            <p className="text-xs text-gray-500">Biologische ouders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Voogden</CardTitle>
              <Shield className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{guardiansCount}</div>
            <p className="text-xs text-gray-500">Wettelijke voogden</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Zoek op naam of email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={relationshipFilter} onValueChange={setRelationshipFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Relatie filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle relaties</SelectItem>
                <SelectItem value="Ouder">Ouder</SelectItem>
                <SelectItem value="Voogd">Voogd</SelectItem>
                <SelectItem value="Verzorger">Verzorger</SelectItem>
                <SelectItem value="Familie">Familie</SelectItem>
              </SelectContent>
            </Select>
            <Select value={emergencyFilter} onValueChange={setEmergencyFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Noodcontact filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle contacten</SelectItem>
                <SelectItem value="yes">Noodcontacten</SelectItem>
                <SelectItem value="no">Geen noodcontact</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Guardians Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Voogden ({filteredGuardians.length})</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Beheer alle geregistreerde voogden</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voogd</TableHead>
                <TableHead>Relatie</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Adres</TableHead>
                <TableHead>Studenten</TableHead>
                <TableHead>Noodcontact</TableHead>
                <TableHead>Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuardians.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    Geen voogden gevonden
                  </TableCell>
                </TableRow>
              ) : (
                filteredGuardians.map((guardian: Guardian) => (
                  <TableRow key={guardian.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {guardian.firstName[0]}{guardian.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{guardian.firstName} {guardian.lastName}</div>
                          <div className="text-sm text-gray-500">{guardian.occupation || 'Geen beroep opgegeven'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={guardian.relationship === 'Ouder' ? 'default' : 'secondary'}>
                        {guardian.relationship}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="w-3 h-3 text-gray-400 mr-1" />
                          {guardian.email}
                        </div>
                        {guardian.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="w-3 h-3 text-gray-400 mr-1" />
                            {guardian.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {guardian.street && guardian.city ? (
                        <div className="flex items-center text-sm">
                          <MapPin className="w-3 h-3 text-gray-400 mr-1" />
                          <div>
                            <div>{guardian.street} {guardian.houseNumber}</div>
                            <div>{guardian.postalCode} {guardian.city}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Geen adres</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStudentsForGuardian(guardian.id)
                          .map((student: Student) => (
                            <div key={student.id} className="text-sm">
                              {student.firstName} {student.lastName}
                            </div>
                          ))}
                        {getStudentsForGuardian(guardian.id).length === 0 && (
                          <span className="text-gray-400 text-sm">Geen studenten</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {guardian.isEmergencyContact ? (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Noodcontact
                        </Badge>
                      ) : (
                        <span className="text-gray-400">Nee</span>
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
        </CardContent>
      </Card>

      {/* Dialog */}
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
                  <Label className="text-sm font-medium text-gray-700">Beroep</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedGuardian.occupation || 'Niet opgegeven'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Noodcontact</Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedGuardian.isEmergencyContact ? 'Ja' : 'Nee'}
                  </p>
                </div>
              </div>
              
              {(selectedGuardian.street || selectedGuardian.city) && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Adres</Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedGuardian.street} {selectedGuardian.houseNumber}<br />
                    {selectedGuardian.postalCode} {selectedGuardian.city}
                  </p>
                </div>
              )}

              {selectedGuardian.isEmergencyContact && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Noodcontact informatie</Label>
                  <div className="mt-1 p-3 border rounded-md bg-red-50">
                    <p className="text-sm text-gray-900">
                      <strong>Naam:</strong> {selectedGuardian.emergencyContactName || 'Niet opgegeven'}<br />
                      <strong>Telefoon:</strong> {selectedGuardian.emergencyContactPhone || 'Niet opgegeven'}<br />
                      <strong>Relatie:</strong> {selectedGuardian.emergencyContactRelation || 'Niet opgegeven'}
                    </p>
                  </div>
                </div>
              )}

              {selectedGuardian.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Notities</Label>
                  <div className="mt-1 p-3 border rounded-md bg-gray-50">
                    <p className="text-sm text-gray-900">{selectedGuardian.notes}</p>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-700">Gekoppelde studenten</Label>
                <div className="mt-1 space-y-2">
                  {getStudentsForGuardian(selectedGuardian.id).map((student: Student) => (
                    <div key={student.id} className="p-2 border rounded-md bg-blue-50">
                      <p className="text-sm font-medium">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-gray-600">Student ID: {student.studentId}</p>
                    </div>
                  ))}
                  {getStudentsForGuardian(selectedGuardian.id).length === 0 && (
                    <p className="text-sm text-gray-500">Geen studenten gekoppeld</p>
                  )}
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
                            <SelectItem value="Verzorger">Verzorger</SelectItem>
                            <SelectItem value="Familie">Familie</SelectItem>
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
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Straat</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="houseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Huisnummer</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stad</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isEmergencyContact"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-medium">
                            Deze persoon is een noodcontact
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    {form.watch('isEmergencyContact') && (
                      <div className="grid grid-cols-3 gap-4 ml-7 p-4 bg-red-50 rounded-md">
                        <FormField
                          control={form.control}
                          name="emergencyContactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Noodcontact naam</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="emergencyContactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Noodcontact telefoon</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="emergencyContactRelation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Noodcontact relatie</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notities</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
    </div>
  );
}