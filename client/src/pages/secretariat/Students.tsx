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
  Filter,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  MapPin,
  MoreHorizontal,
  Download,
  Upload,
  UserCheck,
  GraduationCap
} from "lucide-react";

// RBAC Resources
const RESOURCES = {
  STUDENTS: 'students',
  GUARDIANS: 'guardians',
  CLASSES: 'classes'
} as const;

interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  classId?: number;
  className?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalInfo?: string;
  enrollmentDate: string;
  guardianId?: number;
  guardianName?: string;
}

interface StudentClass {
  id: number;
  name: string;
  level: string;
  capacity: number;
  currentEnrollment: number;
}

const studentFormSchema = z.object({
  firstName: z.string().min(2, "Voornaam moet minimaal 2 karakters zijn"),
  lastName: z.string().min(2, "Achternaam moet minimaal 2 karakters zijn"),
  email: z.string().email("Ongeldig email adres"),
  phone: z.string().optional(),
  dateOfBirth: z.string().min(1, "Geboortedatum is verplicht"),
  gender: z.enum(['male', 'female'], { required_error: "Geslacht is verplicht" }),
  classId: z.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  medicalInfo: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentFormSchema>;

export default function Students() {
  const { canCreate, canUpdate, canDelete, canRead } = useRBAC();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'create'>('view');

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

  const { data: studentsData, isLoading } = useQuery<{ students: Student[] }>({
    queryKey: ['/api/students'],
    retry: false,
  });

  const { data: classesData } = useQuery<{ classes: StudentClass[] }>({
    queryKey: ['/api/classes'],
    retry: false,
  });

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: undefined,
      address: "",
      city: "",
      postalCode: "",
      emergencyContact: "",
      emergencyPhone: "",
      medicalInfo: "",
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      return apiRequest('POST', '/api/students', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({ title: "Student toegevoegd", description: "De student is succesvol toegevoegd." });
      setShowDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de student.",
        variant: "destructive",
      });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async (data: StudentFormData & { id: number }) => {
      return apiRequest('PUT', `/api/students/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({ title: "Student bijgewerkt", description: "De studentgegevens zijn succesvol bijgewerkt." });
      setShowDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van de student.",
        variant: "destructive",
      });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({ title: "Student verwijderd", description: "De student is succesvol verwijderd." });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van de student.",
        variant: "destructive",
      });
    },
  });

  const students = studentsData?.students || [];
  const classes = classesData?.classes || [];

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch = searchTerm === "" || 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    const matchesClass = classFilter === "all" || student.classId?.toString() === classFilter;
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  const handleCreateStudent = () => {
    setDialogMode('create');
    setSelectedStudent(null);
    form.reset();
    setShowDialog(true);
  };

  const handleViewStudent = (student: Student) => {
    setDialogMode('view');
    setSelectedStudent(student);
    setShowDialog(true);
  };

  const handleEditStudent = (student: Student) => {
    setDialogMode('edit');
    setSelectedStudent(student);
    form.reset({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone || "",
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      classId: student.classId,
      address: student.address || "",
      city: student.city || "",
      postalCode: student.postalCode || "",
      emergencyContact: student.emergencyContact || "",
      emergencyPhone: student.emergencyPhone || "",
      medicalInfo: student.medicalInfo || "",
    });
    setShowDialog(true);
  };

  const handleDeleteStudent = (student: Student) => {
    if (window.confirm(`Weet je zeker dat je ${student.firstName} ${student.lastName} wilt verwijderen?`)) {
      deleteStudentMutation.mutate(student.id);
    }
  };

  const onSubmit = (data: StudentFormData) => {
    if (dialogMode === 'create') {
      createStudentMutation.mutate(data);
    } else if (dialogMode === 'edit' && selectedStudent) {
      updateStudentMutation.mutate({ ...data, id: selectedStudent.id });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><UserCheck className="w-3 h-3 mr-1" />Actief</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactief</Badge>;
      case 'graduated':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><GraduationCap className="w-3 h-3 mr-1" />Afgestudeerd</Badge>;
      case 'transferred':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Overgeplaatst</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
          <h1 className="text-3xl font-bold text-gray-900">Studenten</h1>
          <p className="text-gray-600 mt-2">
            Beheer student informatie en inschrijvingen
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporteren
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importeren
          </Button>
          {canCreate(RESOURCES.STUDENTS) && (
            <Button onClick={handleCreateStudent} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
              <UserPlus className="w-4 h-4 mr-2" />
              Nieuwe Student
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Totaal Studenten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-gray-500">Alle studenten</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Actieve Studenten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {students.filter(s => s.status === 'active').length}
            </div>
            <p className="text-xs text-gray-500">Momenteel ingeschreven</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Nieuwe Studenten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {students.filter(s => {
                const enrollmentDate = new Date(s.enrollmentDate);
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                return enrollmentDate > oneMonthAgo;
              }).length}
            </div>
            <p className="text-xs text-gray-500">Laatste maand</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Klassen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">{classes.length}</div>
            <p className="text-xs text-gray-500">Beschikbare klassen</p>
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
                  placeholder="Zoek op naam, email of student ID..."
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
                  <SelectItem value="active">Actief</SelectItem>
                  <SelectItem value="inactive">Inactief</SelectItem>
                  <SelectItem value="graduated">Afgestudeerd</SelectItem>
                  <SelectItem value="transferred">Overgeplaatst</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Klas filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle klassen</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Studenten ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Klas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Inschrijfdatum</TableHead>
                  <TableHead>Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      Geen studenten gevonden
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {student.firstName[0]}{student.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{student.firstName} {student.lastName}</div>
                            <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="w-4 h-4 text-gray-400 mr-2" />
                            {student.email}
                          </div>
                          {student.phone && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Phone className="w-4 h-4 text-gray-400 mr-2" />
                              {student.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.className ? (
                          <div className="flex items-center">
                            <BookOpen className="w-4 h-4 text-gray-400 mr-2" />
                            {student.className}
                          </div>
                        ) : (
                          <span className="text-gray-500">Geen klas</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {new Date(student.enrollmentDate).toLocaleDateString('nl-NL')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStudent(student)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canUpdate(RESOURCES.STUDENTS) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStudent(student)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDelete(RESOURCES.STUDENTS) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStudent(student)}
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

      {/* Student Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' && 'Nieuwe Student Toevoegen'}
              {dialogMode === 'edit' && 'Student Bewerken'}
              {dialogMode === 'view' && 'Student Details'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogMode === 'view' && selectedStudent ? (
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
                      <span>{selectedStudent.firstName} {selectedStudent.lastName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Email:</span>
                      <span>{selectedStudent.email}</span>
                    </div>
                    {selectedStudent.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Telefoon:</span>
                        <span>{selectedStudent.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Geboortedatum:</span>
                      <span>{new Date(selectedStudent.dateOfBirth).toLocaleDateString('nl-NL')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Geslacht:</span>
                      <span>{selectedStudent.gender === 'male' ? 'Man' : 'Vrouw'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Status:</span>
                      {getStatusBadge(selectedStudent.status)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">School Informatie</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Student ID:</span>
                      <span>{selectedStudent.studentId}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Klas:</span>
                      <span>{selectedStudent.className || 'Geen klas toegewezen'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Inschrijfdatum:</span>
                      <span>{new Date(selectedStudent.enrollmentDate).toLocaleDateString('nl-NL')}</span>
                    </div>
                    {selectedStudent.guardianName && (
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Voogd:</span>
                        <span>{selectedStudent.guardianName}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Address Information */}
              {(selectedStudent.address || selectedStudent.city || selectedStudent.postalCode) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Adres Informatie</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedStudent.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Adres:</span>
                        <span>{selectedStudent.address}</span>
                      </div>
                    )}
                    {selectedStudent.city && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Stad:</span>
                        <span>{selectedStudent.city}</span>
                      </div>
                    )}
                    {selectedStudent.postalCode && (
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Postcode:</span>
                        <span>{selectedStudent.postalCode}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Emergency Contact */}
              {(selectedStudent.emergencyContact || selectedStudent.emergencyPhone) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Noodcontact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedStudent.emergencyContact && (
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Contactpersoon:</span>
                        <span>{selectedStudent.emergencyContact}</span>
                      </div>
                    )}
                    {selectedStudent.emergencyPhone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">Telefoonnummer:</span>
                        <span>{selectedStudent.emergencyPhone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Medical Information */}
              {selectedStudent.medicalInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Medische Informatie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedStudent.medicalInfo}</p>
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
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geslacht</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer geslacht" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Man</SelectItem>
                            <SelectItem value="female">Vrouw</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Klas</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer klas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Geen klas</SelectItem>
                            {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                {cls.name}
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

                  <FormField
                    control={form.control}
                    name="emergencyContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Noodcontact</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyPhone"
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
                </div>

                <FormField
                  control={form.control}
                  name="medicalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medische Informatie</FormLabel>
                      <FormControl>
                        <textarea 
                          {...field}
                          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                          rows={3}
                          placeholder="Allergieën, medicijnen, bijzondere aandachtspunten..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Annuleren
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-violet-600 hover:bg-violet-700"
                    disabled={createStudentMutation.isPending || updateStudentMutation.isPending}
                  >
                    {dialogMode === 'create' ? 'Student Toevoegen' : 'Wijzigingen Opslaan'}
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