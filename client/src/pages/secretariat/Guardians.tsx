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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/useRBAC";
import {
  Users,
  UserPlus,
  Search,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Shield,
  Heart,
  Building,
  FileText
} from "lucide-react";

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
  city?: string;
  postalCode?: string;
  isEmergencyContact: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  notes?: string;
  occupation?: string;
  students?: Student[];
}

interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  status: string;
}

const guardianFormSchema = z.object({
  firstName: z.string().min(2, "Voornaam moet minimaal 2 karakters zijn"),
  lastName: z.string().min(2, "Achternaam moet minimaal 2 karakters zijn"),
  relationship: z.string().min(1, "Relatie is verplicht"),
  email: z.string().email("Ongeldig email adres"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  isEmergencyContact: z.boolean().default(false),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  notes: z.string().optional(),
  occupation: z.string().optional(),
});

type GuardianFormData = z.infer<typeof guardianFormSchema>;

export default function Guardians() {
  const { canCreate, canUpdate, canDelete, canRead } = useRBAC();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [relationshipFilter, setRelationshipFilter] = useState<string>("all");
  const [selectedGuardian, setSelectedGuardian] = useState<Guardian | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'create'>('view');

  if (!canRead(RESOURCES.GUARDIANS)) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              Je hebt geen toegang tot deze pagina.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: guardiansData, isLoading } = useQuery<{ guardians: Guardian[] }>({
    queryKey: ['/api/guardians'],
    retry: false,
  });

  const form = useForm<GuardianFormData>({
    resolver: zodResolver(guardianFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      relationship: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      isEmergencyContact: false,
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
      notes: "",
      occupation: "",
    },
  });

  const createGuardianMutation = useMutation({
    mutationFn: async (data: GuardianFormData) => {
      return apiRequest('POST', '/api/guardians', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      toast({ title: "Voogd toegevoegd", description: "De voogd is succesvol toegevoegd." });
      setShowDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de voogd.",
        variant: "destructive",
      });
    },
  });

  const updateGuardianMutation = useMutation({
    mutationFn: async (data: GuardianFormData & { id: number }) => {
      return apiRequest('PUT', `/api/guardians/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      toast({ title: "Voogd bijgewerkt", description: "De voogdgegevens zijn succesvol bijgewerkt." });
      setShowDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van de voogd.",
        variant: "destructive",
      });
    },
  });

  const deleteGuardianMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/guardians/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      toast({ title: "Voogd verwijderd", description: "De voogd is succesvol verwijderd." });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van de voogd.",
        variant: "destructive",
      });
    },
  });

  const guardians = guardiansData?.guardians || [];

  const filteredGuardians = guardians.filter((guardian) => {
    const matchesSearch = searchTerm === "" || 
      guardian.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guardian.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guardian.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRelationship = relationshipFilter === "all" || guardian.relationship === relationshipFilter;
    
    return matchesSearch && matchesRelationship;
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
      address: guardian.address || "",
      city: guardian.city || "",
      postalCode: guardian.postalCode || "",
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
    } else if (dialogMode === 'edit' && selectedGuardian) {
      updateGuardianMutation.mutate({ ...data, id: selectedGuardian.id });
    }
  };

  const getRelationshipBadge = (relationship: string) => {
    switch (relationship.toLowerCase()) {
      case 'vader':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Vader</Badge>;
      case 'moeder':
        return <Badge variant="secondary" className="bg-pink-100 text-pink-800">Moeder</Badge>;
      case 'voogd':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Voogd</Badge>;
      case 'grootouder':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Grootouder</Badge>;
      default:
        return <Badge variant="outline">{relationship}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Voogden</h1>
          <p className="text-gray-600 mt-2">
            Beheer voogd informatie en contactgegevens
          </p>
        </div>
        {canCreate(RESOURCES.GUARDIANS) && (
          <Button onClick={handleCreateGuardian} className="bg-violet-600 hover:bg-violet-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Nieuwe Voogd
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Totaal Voogden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guardians.length}</div>
            <p className="text-xs text-gray-500">Geregistreerde voogden</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Noodcontacten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {guardians.filter(g => g.isEmergencyContact).length}
            </div>
            <p className="text-xs text-gray-500">Beschikbare noodcontacten</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ouders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {guardians.filter(g => ['vader', 'moeder'].includes(g.relationship.toLowerCase())).length}
            </div>
            <p className="text-xs text-gray-500">Vader en moeder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Andere Voogden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">
              {guardians.filter(g => !['vader', 'moeder'].includes(g.relationship.toLowerCase())).length}
            </div>
            <p className="text-xs text-gray-500">Overige voogden</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
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
            <div className="w-full sm:w-48">
              <Select value={relationshipFilter} onValueChange={setRelationshipFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Relatie filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle relaties</SelectItem>
                  <SelectItem value="vader">Vader</SelectItem>
                  <SelectItem value="moeder">Moeder</SelectItem>
                  <SelectItem value="voogd">Voogd</SelectItem>
                  <SelectItem value="grootouder">Grootouder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guardians Table */}
      <Card>
        <CardHeader>
          <CardTitle>Voogden ({filteredGuardians.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Relatie</TableHead>
                  <TableHead>Studenten</TableHead>
                  <TableHead>Noodcontact</TableHead>
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
                  filteredGuardians.map((guardian) => (
                    <TableRow key={guardian.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-violet-700">
                              {guardian.firstName[0]}{guardian.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{guardian.firstName} {guardian.lastName}</div>
                            {guardian.occupation && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <Building className="w-3 h-3 mr-1" />
                                {guardian.occupation}
                              </div>
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
                      <TableCell>{getRelationshipBadge(guardian.relationship)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {guardian.students && guardian.students.length > 0 ? (
                            guardian.students
                              .filter((student: Student) => student.status === 'active')
                              .map((student: Student) => (
                                <div key={student.id} className="text-sm">
                                  {student.firstName} {student.lastName}
                                </div>
                              ))
                          ) : (
                            <span className="text-gray-500 text-sm">Geen studenten</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {guardian.isEmergencyContact ? (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            <Shield className="w-3 h-3 mr-1" />
                            Noodcontact
                          </Badge>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewGuardian(guardian)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canUpdate(RESOURCES.GUARDIANS) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditGuardian(guardian)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete(RESOURCES.GUARDIANS) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGuardian(guardian)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Guardian Dialog */}
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
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Persoonlijke Gegevens</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Naam:</span>
                      <span>{selectedGuardian.firstName} {selectedGuardian.lastName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Relatie:</span>
                      {getRelationshipBadge(selectedGuardian.relationship)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Email:</span>
                      <span>{selectedGuardian.email}</span>
                    </div>
                    {selectedGuardian.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Telefoon:</span>
                        <span>{selectedGuardian.phone}</span>
                      </div>
                    )}
                    {selectedGuardian.occupation && (
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Beroep:</span>
                        <span>{selectedGuardian.occupation}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Informatie</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedGuardian.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Adres:</span>
                        <span>{selectedGuardian.address}</span>
                      </div>
                    )}
                    {selectedGuardian.city && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Stad:</span>
                        <span>{selectedGuardian.city}</span>
                      </div>
                    )}
                    {selectedGuardian.postalCode && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Postcode:</span>
                        <span>{selectedGuardian.postalCode}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Noodcontact:</span>
                      {selectedGuardian.isEmergencyContact ? (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">Ja</Badge>
                      ) : (
                        <span className="text-gray-500">Nee</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Students */}
              {selectedGuardian.students && selectedGuardian.students.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Gekoppelde Studenten</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedGuardian.students.map((student: Student) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-700">
                                {student.firstName[0]}{student.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{student.firstName} {student.lastName}</div>
                              <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                            </div>
                          </div>
                          <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                            {student.status === 'active' ? 'Actief' : student.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Emergency Contact */}
              {selectedGuardian.isEmergencyContact && (selectedGuardian.emergencyContactName || selectedGuardian.emergencyContactPhone) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Noodcontact Informatie</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedGuardian.emergencyContactName && (
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Contactpersoon:</span>
                        <span>{selectedGuardian.emergencyContactName}</span>
                      </div>
                    )}
                    {selectedGuardian.emergencyContactPhone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Telefoonnummer:</span>
                        <span>{selectedGuardian.emergencyContactPhone}</span>
                      </div>
                    )}
                    {selectedGuardian.emergencyContactRelation && (
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Relatie:</span>
                        <span>{selectedGuardian.emergencyContactRelation}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {selectedGuardian.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedGuardian.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer relatie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vader">Vader</SelectItem>
                            <SelectItem value="moeder">Moeder</SelectItem>
                            <SelectItem value="voogd">Voogd</SelectItem>
                            <SelectItem value="grootouder">Grootouder</SelectItem>
                            <SelectItem value="andere">Andere</SelectItem>
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
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adres</FormLabel>
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
                </div>

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
                            className="w-4 h-4 text-violet-600 bg-gray-100 border-gray-300 rounded focus:ring-violet-500"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Is noodcontact
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('isEmergencyContact') && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-red-50 rounded-lg">
                      <FormField
                        control={form.control}
                        name="emergencyContactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Noodcontact Naam</FormLabel>
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
                            <FormLabel>Noodcontact Telefoon</FormLabel>
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
                            <FormLabel>Noodcontact Relatie</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notities</FormLabel>
                        <FormControl>
                          <textarea 
                            {...field}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                            rows={3}
                            placeholder="Aanvullende informatie, bijzondere omstandigheden..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Annuleren
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-violet-600 hover:bg-violet-700"
                    disabled={createGuardianMutation.isPending || updateGuardianMutation.isPending}
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