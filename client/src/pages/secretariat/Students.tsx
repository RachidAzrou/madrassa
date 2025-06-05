import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  BookOpen,
  GraduationCap,
  Download,
  Upload,
  Mail,
  Phone,
  Calendar,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { RESOURCES } from "@shared/rbac";

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
  firstName: z.string().min(1, "Voornaam is verplicht"),
  lastName: z.string().min(1, "Achternaam is verplicht"),
  email: z.string().email("Ongeldig email adres"),
  phone: z.string().optional(),
  dateOfBirth: z.string().min(1, "Geboortedatum is verplicht"),
  gender: z.enum(['male', 'female']),
  classId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  medicalInfo: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentFormSchema>;

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { canCreate, canUpdate, canDelete } = useRBAC();

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "male",
      classId: "",
      address: "",
      city: "",
      postalCode: "",
      emergencyContact: "",
      emergencyPhone: "",
      medicalInfo: "",
    },
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ["/api/classes"],
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      const response = await apiRequest("POST", "/api/students", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Student succesvol toegevoegd" });
      setShowDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      const response = await apiRequest("PUT", `/api/students/${selectedStudent?.id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Student succesvol bijgewerkt" });
      setShowDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      await apiRequest("DELETE", `/api/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Student succesvol verwijderd" });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredStudents = students.filter((student: Student) => {
    const matchesSearch = 
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
      classId: student.classId?.toString() || "",
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
    } else if (dialogMode === 'edit') {
      updateStudentMutation.mutate(data);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      graduated: "bg-blue-100 text-blue-800",
      transferred: "bg-yellow-100 text-yellow-800"
    };
    
    const labels = {
      active: "Actief",
      inactive: "Inactief",
      graduated: "Afgestudeerd",
      transferred: "Overgeplaatst"
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (studentsLoading || classesLoading) {
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
        title="Studenten" 
        description="Beheer student informatie en inschrijvingen"
      >
        <AdminActionButton variant="outline" icon={<Download className="w-4 h-4" />}>
          Exporteren
        </AdminActionButton>
        <AdminActionButton variant="outline" icon={<Upload className="w-4 h-4" />}>
          Importeren
        </AdminActionButton>
        {canCreate(RESOURCES.STUDENTS) && (
          <AdminActionButton 
            icon={<UserPlus className="w-4 h-4" />}
            onClick={handleCreateStudent}
          >
            Nieuwe Student
          </AdminActionButton>
        )}
      </AdminPageHeader>

      <AdminStatsGrid columns={4}>
        <AdminStatCard
          title="Totaal Studenten"
          value={students.length}
          subtitle="Alle studenten"
          icon={<Users className="h-4 w-4" />}
        />
        <AdminStatCard
          title="Actieve Studenten"
          value={students.filter((s: Student) => s.status === 'active').length}
          subtitle="Momenteel ingeschreven"
          valueColor="text-green-600"
          icon={<UserCheck className="h-4 w-4" />}
        />
        <AdminStatCard
          title="Nieuwe Studenten"
          value={students.filter((s: Student) => {
            const enrollmentDate = new Date(s.enrollmentDate);
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            return enrollmentDate > oneMonthAgo;
          }).length}
          subtitle="Laatste maand"
          valueColor="text-blue-600"
          icon={<UserPlus className="h-4 w-4" />}
        />
        <AdminStatCard
          title="Klassen"
          value={classes.length}
          subtitle="Beschikbare klassen"
          valueColor="text-blue-600"
          icon={<BookOpen className="h-4 w-4" />}
        />
      </AdminStatsGrid>

      <AdminSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Zoek op naam, email of student ID..."
        filters={
          <>
            <AdminFilterSelect
              value={statusFilter}
              onValueChange={setStatusFilter}
              placeholder="Status filter"
              options={[
                { value: "all", label: "Alle statussen" },
                { value: "active", label: "Actief" },
                { value: "inactive", label: "Inactief" },
                { value: "graduated", label: "Afgestudeerd" },
                { value: "transferred", label: "Overgeplaatst" }
              ]}
            />
            <AdminFilterSelect
              value={classFilter}
              onValueChange={setClassFilter}
              placeholder="Klas filter"
              options={[
                { value: "all", label: "Alle klassen" },
                ...classes.map((cls: StudentClass) => ({
                  value: cls.id.toString(),
                  label: cls.name
                }))
              ]}
            />
          </>
        }
      />

      <AdminTableCard 
        title={`Studenten (${filteredStudents.length})`}
        subtitle="Beheer alle geregistreerde studenten"
      >
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
              filteredStudents.map((student: Student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <AdminAvatar initials={`${student.firstName[0]}${student.lastName[0]}`} />
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
                    <AdminActionButtons
                      onView={() => handleViewStudent(student)}
                      onEdit={canUpdate(RESOURCES.STUDENTS) ? () => handleEditStudent(student) : undefined}
                      onDelete={canDelete(RESOURCES.STUDENTS) ? () => handleDeleteStudent(student) : undefined}
                      canEdit={canUpdate(RESOURCES.STUDENTS)}
                      canDelete={canDelete(RESOURCES.STUDENTS)}
                    />
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
              {dialogMode === 'create' && 'Nieuwe Student Toevoegen'}
              {dialogMode === 'edit' && 'Student Bewerken'}
              {dialogMode === 'view' && 'Student Details'}
            </DialogTitle>
          </DialogHeader>
          
          {dialogMode === 'view' && selectedStudent ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Voornaam</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedStudent.firstName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Achternaam</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedStudent.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedStudent.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Telefoon</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedStudent.phone || 'Niet opgegeven'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Geboortedatum</Label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedStudent.dateOfBirth).toLocaleDateString('nl-NL')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Geslacht</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedStudent.gender === 'male' ? 'Man' : 'Vrouw'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedStudent.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Klas</Label>
                  <p className="mt-1 text-sm text-gray-900">{selectedStudent.className || 'Geen klas toegewezen'}</p>
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
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Geslacht</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Select onValueChange={(value: any) => field.onChange(value)} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer klas" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Geen klas</SelectItem>
                            {classes.map((cls: StudentClass) => (
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
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Annuleren
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createStudentMutation.isPending || updateStudentMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    {dialogMode === 'create' ? 'Student Toevoegen' : 'Wijzigingen Opslaan'}
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