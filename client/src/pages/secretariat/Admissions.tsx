import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  GraduationCap,
  UserPlus,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Upload,
  Calendar,
  Eye,
  Edit,
  Trash2,
  School,
  FileText
} from "lucide-react";

// Define RESOURCES locally
const RESOURCES = {
  ADMISSIONS: 'admissions',
  STUDENTS: 'students'
} as const;

interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  programId: number;
  programName: string;
  academicYearId: number;
  academicYear: string;
  previousEducation: string;
  personalStatement: string;
  status: string;
  applicationDate: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
}

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

const admissionFormSchema = z.object({
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  email: z.string().email("Ongeldig email adres"),
  phone: z.string().min(1, "Telefoon is verplicht"),
  dateOfBirth: z.string().min(1, "Geboortedatum is verplicht"),
  programId: z.string().min(1, "Programma selecteren is verplicht"),
  academicYearId: z.string().min(1, "Academisch jaar selecteren is verplicht"),
  previousEducation: z.string().min(1, "Vooropleiding is verplicht"),
  personalStatement: z.string().min(1, "Motivatiebrief is verplicht"),
});

type AdmissionFormData = z.infer<typeof admissionFormSchema>;

export default function Admissions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreate, canUpdate, canDelete } = useRBAC();

  const form = useForm<AdmissionFormData>({
    resolver: zodResolver(admissionFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      programId: "",
      academicYearId: "",
      previousEducation: "",
      personalStatement: "",
    },
  });

  const { data: applicants = [], isLoading: applicantsLoading } = useQuery<Applicant[]>({
    queryKey: ["/api/admissions/applicants"],
  });

  const { data: programs = [], isLoading: programsLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: academicYears = [], isLoading: academicYearsLoading } = useQuery<AcademicYear[]>({
    queryKey: ["/api/academic-years"],
  });

  const createApplicantMutation = useMutation({
    mutationFn: async (data: AdmissionFormData) => {
      const response = await apiRequest("POST", "/api/admissions/applicants", { body: data });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admissions/applicants"] });
      toast({ title: "Aanmelding succesvol toegevoegd" });
      setShowDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen aanmelding",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateApplicantMutation = useMutation({
    mutationFn: async (data: AdmissionFormData) => {
      const response = await apiRequest("PUT", `/api/admissions/applicants/${selectedApplicant?.id}`, { body: data });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admissions/applicants"] });
      toast({ title: "Aanmelding succesvol bijgewerkt" });
      setShowDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken aanmelding",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteApplicantMutation = useMutation({
    mutationFn: async (applicantId: string) => {
      await apiRequest("DELETE", `/api/admissions/applicants/${applicantId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admissions/applicants"] });
      toast({ title: "Aanmelding succesvol verwijderd" });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen aanmelding",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredApplicants = applicants.filter((applicant: Applicant) => {
    const matchesSearch = 
      applicant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || applicant.status === statusFilter;
    const matchesProgram = programFilter === "all" || applicant.programId.toString() === programFilter;
    
    return matchesSearch && matchesStatus && matchesProgram;
  });

  const handleCreateApplicant = () => {
    setDialogMode('create');
    setSelectedApplicant(null);
    form.reset();
    setShowDialog(true);
  };

  const handleViewApplicant = (applicant: Applicant) => {
    setDialogMode('view');
    setSelectedApplicant(applicant);
    setShowDialog(true);
  };

  const handleEditApplicant = (applicant: Applicant) => {
    setDialogMode('edit');
    setSelectedApplicant(applicant);
    form.reset({
      firstName: applicant.firstName,
      lastName: applicant.lastName,
      email: applicant.email,
      phone: applicant.phone,
      dateOfBirth: applicant.dateOfBirth,
      programId: applicant.programId.toString(),
      academicYearId: applicant.academicYearId.toString(),
      previousEducation: applicant.previousEducation,
      personalStatement: applicant.personalStatement,
    });
    setShowDialog(true);
  };

  const handleDeleteApplicant = (applicant: Applicant) => {
    if (window.confirm(`Weet je zeker dat je aanmelding van ${applicant.firstName} ${applicant.lastName} wilt verwijderen?`)) {
      deleteApplicantMutation.mutate(applicant.id);
    }
  };

  const onSubmit = (data: AdmissionFormData) => {
    if (dialogMode === 'create') {
      createApplicantMutation.mutate(data);
    } else if (dialogMode === 'edit') {
      updateApplicantMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { className: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-3 h-3 mr-1" /> },
      approved: { className: "bg-green-100 text-green-800", icon: <CheckCircle className="w-3 h-3 mr-1" /> },
      rejected: { className: "bg-red-100 text-red-800", icon: <XCircle className="w-3 h-3 mr-1" /> },
      waitlist: { className: "bg-blue-100 text-blue-800", icon: <Clock className="w-3 h-3 mr-1" /> }
    };
    
    const labels = {
      pending: "In behandeling",
      approved: "Goedgekeurd",
      rejected: "Afgewezen",
      waitlist: "Wachtlijst"
    };
    
    const variant = variants[status as keyof typeof variants];
    
    return (
      <Badge className={variant.className}>
        <div className="flex items-center">
          {variant.icon}
          {labels[status as keyof typeof labels]}
        </div>
      </Badge>
    );
  };

  const getProgramOptions = () => {
    return programs.map(program => ({ value: program.id, label: program.name }));
  };

  const totalApplications = applicants.length;
  const pendingApplications = applicants.filter(a => a.status === 'pending').length;
  const approvedApplications = applicants.filter(a => a.status === 'approved').length;
  const rejectedApplications = applicants.filter(a => a.status === 'rejected').length;

  if (applicantsLoading || programsLoading || academicYearsLoading) {
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
        title="Aanmeldingen" 
        description="Beheer studentenaanmeldingen en toelatingsprocedures"
      >
        <AdminActionButton variant="outline" icon={<Download className="w-4 h-4" />}>
          Exporteren
        </AdminActionButton>
        <AdminActionButton variant="outline" icon={<Upload className="w-4 h-4" />}>
          Importeren
        </AdminActionButton>
        {canCreate(RESOURCES.ADMISSIONS) && (
          <AdminActionButton 
            icon={<UserPlus className="w-4 h-4" />}
            onClick={handleCreateApplicant}
          >
            Nieuwe Aanmelding
          </AdminActionButton>
        )}
      </AdminPageHeader>

      <AdminStatsGrid columns={4}>
        <AdminStatCard
          title="Totaal Aanmeldingen"
          value={totalApplications}
          subtitle="Alle aanmeldingen"
          icon={<FileText className="h-4 w-4" />}
        />
        <AdminStatCard
          title="In Behandeling"
          value={pendingApplications}
          subtitle="Wachten op beoordeling"
          valueColor="text-yellow-600"
          icon={<Clock className="h-4 w-4" />}
        />
        <AdminStatCard
          title="Goedgekeurd"
          value={approvedApplications}
          subtitle="Toegelaten studenten"
          valueColor="text-green-600"
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <AdminStatCard
          title="Afgewezen"
          value={rejectedApplications}
          subtitle="Niet toegelaten"
          valueColor="text-red-600"
          icon={<XCircle className="h-4 w-4" />}
        />
      </AdminStatsGrid>

      <AdminSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Zoek op naam of email..."
        filters={
          <>
            <AdminFilterSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              placeholder="Status filter"
              options={[
                { value: "all", label: "Alle statussen" },
                { value: "pending", label: "In behandeling" },
                { value: "approved", label: "Goedgekeurd" },
                { value: "rejected", label: "Afgewezen" },
                { value: "waitlist", label: "Wachtlijst" }
              ]}
            />
            <AdminFilterSelect
              value={programFilter}
              onValueChange={setProgramFilter}
              placeholder="Programma filter"
              options={[
                { value: "all", label: "Alle programma's" },
                ...getProgramOptions()
              ]}
            />
          </>
        }
      />

      <AdminTableCard 
        title={`Aanmeldingen (${filteredApplicants.length})`}
        subtitle="Beheer alle studentenaanmeldingen"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aanvrager</TableHead>
              <TableHead>Programma</TableHead>
              <TableHead>Academisch Jaar</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aanmelddatum</TableHead>
              <TableHead>Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplicants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                  Geen aanmeldingen gevonden
                </TableCell>
              </TableRow>
            ) : (
              filteredApplicants.map((applicant: Applicant) => (
                <TableRow key={applicant.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <AdminAvatar initials={`${applicant.firstName[0]}${applicant.lastName[0]}`} />
                      <div>
                        <div className="font-medium">{applicant.firstName} {applicant.lastName}</div>
                        <div className="text-sm text-gray-500">{applicant.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <School className="w-4 h-4 text-gray-400 mr-2" />
                      {applicant.programName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <GraduationCap className="w-4 h-4 text-gray-400 mr-2" />
                      {applicant.academicYear}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(applicant.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      {new Date(applicant.applicationDate).toLocaleDateString('nl-NL')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewApplicant(applicant)}
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canUpdate(RESOURCES.ADMISSIONS) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditApplicant(applicant)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete(RESOURCES.ADMISSIONS) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteApplicant(applicant)}
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
              {dialogMode === 'create' && 'Nieuwe Aanmelding Toevoegen'}
              {dialogMode === 'edit' && 'Aanmelding Bewerken'}
              {dialogMode === 'view' && 'Aanmelding Details'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogMode === 'view' && selectedApplicant ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Naam</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedApplicant.firstName} {selectedApplicant.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedApplicant.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Telefoon</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedApplicant.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Geboortedatum</Label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedApplicant.dateOfBirth).toLocaleDateString('nl-NL')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Programma</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedApplicant.programName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Academisch Jaar</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedApplicant.academicYear}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedApplicant.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Aanmelddatum</Label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedApplicant.applicationDate).toLocaleDateString('nl-NL')}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Vooropleiding</Label>
                <p className="mt-1 text-sm text-gray-900">{selectedApplicant.previousEducation}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Motivatiebrief</Label>
                <div className="mt-1 p-3 border rounded-md bg-gray-50">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedApplicant.personalStatement}</p>
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
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geboortedatum</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="programId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Programma</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer programma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {programs.map((program: Program) => (
                              <SelectItem key={program.id} value={program.id}>
                                {program.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="academicYearId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academisch Jaar</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer academisch jaar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {academicYears.map((year: AcademicYear) => (
                              <SelectItem key={year.id} value={year.id}>
                                {year.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="previousEducation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vooropleiding</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="personalStatement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivatiebrief</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={6} />
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
                    disabled={createApplicantMutation.isPending || updateApplicantMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    {dialogMode === 'create' ? 'Aanmelding Toevoegen' : 'Wijzigingen Opslaan'}
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