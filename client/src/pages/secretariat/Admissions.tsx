import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRBAC } from "@/hooks/useRBAC";

// RBAC Resources - duplicated to avoid import issues
const RESOURCES = {
  STUDENTS: 'students',
  TEACHERS: 'teachers', 
  GUARDIANS: 'guardians',
  CLASSES: 'classes',
  COURSES: 'courses',
  PROGRAMS: 'programs',
  ENROLLMENTS: 'enrollments',
  PAYMENTS: 'payments',
  COMMUNICATIONS: 'communications'
} as const;
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  MoreHorizontal
} from "lucide-react";

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
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn';
  applicationDate: string;
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string;
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

interface AdmissionStats {
  totalApplications: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  withdrawals: number;
  conversionRate: number;
  enrollmentRate: number;
}

export default function Admissions() {
  const { canCreate, canUpdate, canRead } = useRBAC();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Check permissions
  if (!canRead(RESOURCES.STUDENTS)) {
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

  const { data: statsData } = useQuery<{ stats: AdmissionStats }>({
    queryKey: ['/api/admissions/stats'],
    retry: false,
  });

  const { data: applicantsData } = useQuery<{ applicants: Applicant[] }>({
    queryKey: ['/api/admissions'],
    retry: false,
  });

  const { data: programsData } = useQuery<{ programs: Program[] }>({
    queryKey: ['/api/programs'],
    retry: false,
  });

  const { data: academicYearsData } = useQuery<{ academicYears: AcademicYear[] }>({
    queryKey: ['/api/academic-years'],
    retry: false,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      return apiRequest('PUT', `/api/admissions/${id}/status`, { status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admissions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admissions/stats'] });
      toast({
        title: "Status bijgewerkt",
        description: "De aanmeldingsstatus is succesvol bijgewerkt.",
      });
      setShowDetails(false);
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van de status.",
        variant: "destructive",
      });
    },
  });

  const stats = statsData?.stats || {
    totalApplications: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    withdrawals: 0,
    conversionRate: 0,
    enrollmentRate: 0
  };

  const applicants = applicantsData?.applicants || [];
  const programs = programsData?.programs || [];

  // Filter applicants
  const filteredApplicants = applicants.filter((applicant) => {
    const matchesSearch = searchTerm === "" || 
      applicant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || applicant.status === statusFilter;
    const matchesProgram = programFilter === "all" || applicant.programId.toString() === programFilter;
    
    return matchesSearch && matchesStatus && matchesProgram;
  });

  const handleViewApplicant = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setShowDetails(true);
  };

  const handleEditApplicant = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setShowDetails(true);
  };

  const handleDeleteApplicant = (applicant: Applicant) => {
    if (window.confirm(`Weet je zeker dat je de aanmelding van ${applicant.firstName} ${applicant.lastName} wilt verwijderen?`)) {
      // Delete logic here
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />In behandeling</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Goedgekeurd</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Afgewezen</Badge>;
      case 'withdrawn':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Ingetrokken</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aanmeldingen</h1>
          <p className="text-gray-600 mt-2">
            Beheer student aanmeldingen en toelatingsprocedures
          </p>
        </div>
        {canCreate(RESOURCES.STUDENTS) && (
          <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
            <UserPlus className="w-4 h-4 mr-2" />
            Nieuwe Aanmelding
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Totaal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications}</div>
            <p className="text-xs text-gray-500">Aanmeldingen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">In behandeling</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</div>
            <p className="text-xs text-gray-500">Te beoordelen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Goedgekeurd</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-gray-500">Toegelaten</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Afgewezen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-gray-500">Niet toegelaten</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Ingetrokken</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.withdrawals}</div>
            <p className="text-xs text-gray-500">Ingetrokken</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.conversionRate}%</div>
            <p className="text-xs text-gray-500">Slaagpercentage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Inschrijving</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.enrollmentRate}%</div>
            <p className="text-xs text-gray-500">Daadwerkelijk ingeschreven</p>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="pending">In behandeling</SelectItem>
                  <SelectItem value="approved">Goedgekeurd</SelectItem>
                  <SelectItem value="rejected">Afgewezen</SelectItem>
                  <SelectItem value="withdrawn">Ingetrokken</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Programma filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle programma's</SelectItem>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applicants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aanmeldingen ({filteredApplicants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Programma</TableHead>
                  <TableHead>Aanmelddatum</TableHead>
                  <TableHead>Status</TableHead>
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
                  filteredApplicants
                    .map((applicant: Applicant) => (
                      <TableRow key={applicant.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-violet-700">
                                {applicant.firstName[0]}{applicant.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{applicant.firstName} {applicant.lastName}</div>
                              <div className="text-sm text-gray-500">{applicant.phone}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{applicant.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                            <span>{applicant.programName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{new Date(applicant.applicationDate).toLocaleDateString('nl-NL')}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(applicant.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewApplicant(applicant)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {canUpdate(RESOURCES.STUDENTS) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditApplicant(applicant)}
                              >
                                <MoreHorizontal className="w-4 h-4" />
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

      {/* Applicant Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Aanmelding Details - {selectedApplicant?.firstName} {selectedApplicant?.lastName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedApplicant && (
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
                      <span>{selectedApplicant.firstName} {selectedApplicant.lastName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Email:</span>
                      <span>{selectedApplicant.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Telefoon:</span>
                      <span>{selectedApplicant.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Geboortedatum:</span>
                      <span>{new Date(selectedApplicant.dateOfBirth).toLocaleDateString('nl-NL')}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Aanmelding Informatie</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Programma:</span>
                      <span>{selectedApplicant.programName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Schooljaar:</span>
                      <span>{selectedApplicant.academicYear}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Aanmelddatum:</span>
                      <span>{new Date(selectedApplicant.applicationDate).toLocaleDateString('nl-NL')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Status:</span>
                      {getStatusBadge(selectedApplicant.status)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Motivatie en Achtergrond</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-medium">Vorige Opleiding:</Label>
                    <p className="mt-1 text-gray-700">{selectedApplicant.previousEducation}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Motivatiebrief:</Label>
                    <p className="mt-1 text-gray-700 whitespace-pre-wrap">{selectedApplicant.personalStatement}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Guardian Information */}
              {selectedApplicant.guardianName && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Voogd Informatie</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Naam:</span>
                      <span>{selectedApplicant.guardianName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Email:</span>
                      <span>{selectedApplicant.guardianEmail}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Telefoon:</span>
                      <span>{selectedApplicant.guardianPhone}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status Update Actions */}
              {canUpdate(RESOURCES.STUDENTS) && selectedApplicant.status === 'pending' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status Bijwerken</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-4">
                      <Button
                        onClick={() => updateStatusMutation.mutate({ 
                          id: selectedApplicant.id, 
                          status: 'approved' 
                        })}
                        disabled={updateStatusMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Goedkeuren
                      </Button>
                      <Button
                        onClick={() => updateStatusMutation.mutate({ 
                          id: selectedApplicant.id, 
                          status: 'rejected' 
                        })}
                        disabled={updateStatusMutation.isPending}
                        variant="destructive"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Afwijzen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}