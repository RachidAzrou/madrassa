import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { 
  User, 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  FileText,
  Phone,
  Mail,
  Calendar,
  MapPin,
  GraduationCap,
  Upload,
  UserPlus,
  Link,
  AlertTriangle,
  Camera
} from 'lucide-react';
import eidLogoPath from '../../assets/eid-logo.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PremiumHeader } from '@/components/layout/premium-header';
import { DataTableContainer, TableContainer } from '@/components/ui/containers';
import { InvoicePopup } from '@/components/InvoicePopup';

interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  status: string;
  classId?: number;
  className?: string;
  guardianName?: string;
  emergencyContact?: string;
  createdAt: string;
}

interface Guardian {
  id: number;
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  phone: string;
}

interface StudentClass {
  id: number;
  name: string;
  academicYear: string;
  studentCount: number;
}

interface Sibling {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
}

export default function Students() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentSiblings, setStudentSiblings] = useState<Student[]>([]);
  const [availableSiblings, setAvailableSiblings] = useState<Student[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    postalCode: '',
    city: '',
    academicYear: '',
    studentGroupId: '',
    paymentStatus: 'open',
    notes: '',
    guardianId: '',
    selectedSiblings: [] as number[]
  });
  
  // Invoice popup state
  const [isInvoicePopupOpen, setIsInvoicePopupOpen] = useState(false);
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);
  const [createdStudent, setCreatedStudent] = useState<any>(null);
  
  // Sibling search state
  const [siblingSearchTerm, setSiblingSearchTerm] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch students data
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  // Fetch classes data
  const { data: classes = [] } = useQuery<StudentClass[]>({
    queryKey: ['/api/classes'],
  });

  // Fetch guardians data
  const { data: guardians = [] } = useQuery<Guardian[]>({
    queryKey: ['/api/guardians'],
  });

  // Fetch academic years data
  const { data: academicYears = [] } = useQuery({
    queryKey: ['/api/academic-years'],
  });

  // Potential siblings (other students with same last name)
  const potentialSiblings = (students as Student[]).filter(student => 
    student.lastName.toLowerCase() === formData.lastName.toLowerCase() && 
    formData.lastName.trim() !== ''
  );

  // Calculate searchable siblings for view dialog
  const searchableSiblings = (students as Student[]).filter(student => {
    if (!selectedStudent) return false;
    if (student.id === selectedStudent.id) return false; // Exclude the student themselves
    
    const searchTerm = siblingSearchTerm.toLowerCase();
    if (searchTerm === '') {
      // If no search term, show students with same last name
      return student.lastName.toLowerCase() === selectedStudent.lastName.toLowerCase();
    }
    
    // Search by first name, last name, or student ID
    return (
      student.firstName.toLowerCase().includes(searchTerm) ||
      student.lastName.toLowerCase().includes(searchTerm) ||
      student.studentId.toLowerCase().includes(searchTerm)
    );
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: async (studentData: any) => {
      const formDataToSend = new FormData();
      Object.entries(studentData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'selectedSiblings') {
          formDataToSend.append(key, value as string);
        }
      });
      
      if (photoFile) {
        formDataToSend.append('photo', photoFile);
      }

      const response = await fetch('/api/students', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create student');
      }

      const newStudent = await response.json();

      // Als er broers/zussen zijn geselecteerd, voeg deze toe
      if (studentData.selectedSiblings && studentData.selectedSiblings.length > 0) {
        try {
          const siblingResponse = await fetch(`/api/students/${newStudent.id}/siblings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              siblingIds: studentData.selectedSiblings
            }),
          });

          if (!siblingResponse.ok) {
            console.error('Failed to link siblings, but student was created');
          }
        } catch (error) {
          console.error('Error linking siblings:', error);
        }
      }

      return newStudent;
    },
    onSuccess: (newStudent) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsCreateDialogOpen(false);
      resetForm();
      
      // Check if fee details are included (payment was created)
      if (newStudent.feeCreated && newStudent.feeDetails) {
        // Set up invoice popup data
        setCreatedStudent({
          firstName: newStudent.firstName,
          lastName: newStudent.lastName,
          studentId: newStudent.studentId
        });
        
        setInvoiceDetails({
          id: newStudent.feeDetails.id,
          invoiceNumber: newStudent.feeDetails.invoiceNumber,
          amount: newStudent.feeDetails.amount,
          originalAmount: newStudent.feeDetails.originalAmount,
          dueDate: newStudent.feeDetails.dueDate,
          hasDiscount: newStudent.feeDetails.hasDiscount,
          discountInfo: newStudent.feeDetails.discountInfo,
          qrCode: newStudent.feeDetails.qrCode,
          paymentUrl: newStudent.feeDetails.paymentUrl
        });
        
        // Show invoice popup
        setIsInvoicePopupOpen(true);
        
        toast({
          title: "Student en factuur aangemaakt",
          description: "Student succesvol toegevoegd. Factuur met QR-code is gegenereerd.",
        });
      } else {
        toast({
          title: "Succes",
          description: "Student succesvol toegevoegd.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      postalCode: '',
      city: '',
      academicYear: '',
      studentGroupId: '',
      paymentStatus: 'open',
      notes: '',
      guardianId: '',
      selectedSiblings: []
    });
    setPhotoFile(null);
    setPhotoPreview('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Bestand te groot",
          description: "Foto mag maximaal 5MB zijn.",
          variant: "destructive",
        });
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEidScan = async () => {
    try {
      toast({
        title: "eID Scanner",
        description: "Bezig met scannen van identiteitskaart...",
      });

      // Call backend API to process eID
      const response = await apiRequest('POST', '/api/eid/process', {});
      
      if (response.success && response.data) {
        const eidData = response.data;
        
        // Auto-fill form with eID data
        setFormData(prev => ({
          ...prev,
          firstName: eidData.firstName || prev.firstName,
          lastName: eidData.lastName || prev.lastName,
          dateOfBirth: eidData.dateOfBirth || prev.dateOfBirth,
          gender: eidData.gender || prev.gender,
          address: eidData.address || prev.address,
          postalCode: eidData.postalCode || prev.postalCode,
          city: eidData.city || prev.city,
        }));

        // Set photo if available
        if (eidData.photo) {
          setPhotoPreview(eidData.photo);
          // Convert base64 to file if needed for upload
          const photoBlob = await fetch(eidData.photo).then(r => r.blob());
          const photoFile = new File([photoBlob], 'eid-photo.jpg', { type: 'image/jpeg' });
          setPhotoFile(photoFile);
        }

        toast({
          title: "eID Succesvol Gescand",
          description: "Gegevens zijn automatisch ingevuld vanuit de identiteitskaart.",
        });
      }
    } catch (error: any) {
      console.error('eID scan error:', error);
      toast({
        title: "eID Scan Mislukt",
        description: error.message || "Er is een fout opgetreden bij het scannen van de identiteitskaart.",
        variant: "destructive",
      });
    }
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    createStudentMutation.mutate(formData);
  };

  const handleViewStudent = async (student: Student) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
    
    // Load siblings for this student
    try {
      const response = await fetch(`/api/students/${student.id}/siblings`);
      if (response.ok) {
        const siblings = await response.json();
        setStudentSiblings(siblings);
      }
    } catch (error) {
      console.error('Error loading siblings:', error);
    }

    // Load available siblings (other students with same last name, excluding current student and existing siblings)
    const potential = (students as Student[]).filter(s => 
      s.id !== student.id && 
      s.lastName.toLowerCase() === student.lastName.toLowerCase()
    );
    setAvailableSiblings(potential);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      address: '',
      postalCode: '',
      city: '',
      academicYear: '2024-2025',
      studentGroupId: student.classId?.toString() || '',
      notes: '',
      guardianId: '',
      selectedSiblings: []
    });
    setIsCreateDialogOpen(true);
  };

  const handleSiblingToggle = (studentId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedSiblings: prev.selectedSiblings.includes(studentId)
        ? prev.selectedSiblings.filter(id => id !== studentId)
        : [...prev.selectedSiblings, studentId]
    }));
  };

  const handleDeleteStudent = (student: Student) => {
    // Implementation for delete student
    console.log('Delete student:', student);
  };

  // Add sibling to current student
  const addSiblingMutation = useMutation({
    mutationFn: async ({ studentId, siblingId }: { studentId: number; siblingId: number }) => {
      const response = await fetch(`/api/students/${studentId}/siblings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siblingIds: [siblingId]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add sibling');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succes",
        description: "Broer/zus succesvol toegevoegd.",
      });
      // Reload siblings for current student
      if (selectedStudent) {
        handleViewStudent(selectedStudent);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove sibling from current student
  const removeSiblingMutation = useMutation({
    mutationFn: async ({ studentId, siblingId }: { studentId: number; siblingId: number }) => {
      const response = await fetch(`/api/students/${studentId}/siblings/${siblingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove sibling');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succes", 
        description: "Broer/zus koppeling verwijderd.",
      });
      // Reload siblings for current student
      if (selectedStudent) {
        handleViewStudent(selectedStudent);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredStudents = (students as Student[]).filter((student: Student) => {
    const matchesSearch = student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    const matchesClass = classFilter === 'all' || student.classId?.toString() === classFilter;
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  const QuickActions = ({ onView, onEdit, onDelete }: any) => (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onView}
        className="h-8 w-8 p-0 hover:bg-blue-50"
      >
        <Eye className="h-4 w-4 text-blue-600" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="h-8 w-8 p-0 hover:bg-yellow-50"
      >
        <Edit className="h-4 w-4 text-yellow-600" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-8 w-8 p-0 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PremiumHeader
        title="Studentenbeheer"
        description="Beheer alle studenten in het systeem"
        icon={Users}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 premium-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totaal Studenten</p>
                <p className="text-2xl font-bold text-blue-600">{(students as Student[]).length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 premium-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Actieve Studenten</p>
                <p className="text-2xl font-bold text-green-600">
                  {(students as Student[]).filter((s: Student) => s.status === 'active').length}
                </p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500 premium-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nieuwe Studenten</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {(students as Student[]).filter((s: Student) => s.status === 'pending').length}
                </p>
              </div>
              <UserPlus className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 premium-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactieve Studenten</p>
                <p className="text-2xl font-bold text-red-600">
                  {(students as Student[]).filter((s: Student) => s.status === 'inactive').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Zoek studenten op naam, email of student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-80 border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-200"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="active">Actief</SelectItem>
              <SelectItem value="pending">In behandeling</SelectItem>
              <SelectItem value="inactive">Inactief</SelectItem>
            </SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Klas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle klassen</SelectItem>
              {(classes as StudentClass[]).map((cls: StudentClass) => (
                <SelectItem key={cls.id} value={cls.id.toString()}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-[#1e40af] hover:bg-[#1d3a9e] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Student Toevoegen
        </Button>
      </div>

      {/* Students Table */}
      <DataTableContainer className="modern-table">
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow className="modern-table-header">
                <TableHead className="font-semibold text-gray-700">Student</TableHead>
                <TableHead className="font-semibold text-gray-700 hidden sm:table-cell">Contact</TableHead>
                <TableHead className="font-semibold text-gray-700 hidden md:table-cell">Klas</TableHead>
                <TableHead className="font-semibold text-gray-700 hidden lg:table-cell">Status</TableHead>
                <TableHead className="font-semibold text-gray-700 hidden lg:table-cell">Inschrijving</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Geen studenten gevonden
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student: Student) => (
                  <TableRow key={student.id} className="hover:bg-gray-50">
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">ID: {student.studentId}</div>
                          
                          {/* Mobile-only additional info */}
                          <div className="sm:hidden mt-1 space-y-1">
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Mail className="h-3 w-3" />
                              <span>{student.email}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <Badge
                                variant={
                                  student.status === 'active'
                                    ? 'default'
                                    : student.status === 'pending'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                                className={cn(
                                  "text-xs",
                                  student.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : student.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                )}
                              >
                                {student.status === 'active'
                                  ? 'Actief'
                                  : student.status === 'pending'
                                  ? 'In behandeling'
                                  : 'Inactief'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 hidden sm:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{student.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600">{student.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-900">
                        {student.className || 'Niet toegewezen'}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 hidden lg:table-cell">
                      <Badge
                        variant={
                          student.status === 'active'
                            ? 'default'
                            : student.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                        className={
                          student.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : student.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {student.status === 'active'
                          ? 'Actief'
                          : student.status === 'pending'
                          ? 'In behandeling'
                          : 'Inactief'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">
                        {new Date(student.createdAt).toLocaleDateString('nl-NL')}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <QuickActions
                        onView={() => handleViewStudent(student)}
                        onEdit={() => handleEditStudent(student)}
                        onDelete={() => handleDeleteStudent(student)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DataTableContainer>

      {/* Create Student Dialog */}
      <Dialog 
        open={isCreateDialogOpen} 
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden max-h-[90vh]">
          <div className="bg-[#1e40af] py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-semibold m-0">
                  Student Toevoegen
                </DialogTitle>
                <DialogDescription className="text-white/70 text-sm m-0">
                  Voeg een nieuwe student toe aan het systeem.
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleCreateStudent} className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 150px)' }}>
            <div className="px-6 py-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-4 md:col-span-2">
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Persoonlijke Informatie
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">Voornaam *</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-9"
                          placeholder="Voornaam"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="lastName" className="text-xs font-medium text-gray-700">Achternaam *</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-9"
                          placeholder="Achternaam"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className="text-xs font-medium text-gray-700">E-mail *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-9"
                          placeholder="E-mailadres"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone" className="text-xs font-medium text-gray-700">Telefoon</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="mt-1 h-9"
                          placeholder="Telefoonnummer"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="dateOfBirth" className="text-xs font-medium text-gray-700">Geboortedatum *</Label>
                        <Input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-9"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="gender" className="text-xs font-medium text-gray-700">Geslacht *</Label>
                        <Select 
                          value={formData.gender} 
                          onValueChange={(value) => handleSelectChange('gender', value)}
                        >
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue placeholder="Selecteer geslacht" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Man</SelectItem>
                            <SelectItem value="female">Vrouw</SelectItem>
                            <SelectItem value="other">Anders</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Adresgegevens
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <Label htmlFor="address" className="text-xs font-medium text-gray-700">Adres</Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="mt-1 h-9"
                          placeholder="Straat en huisnummer"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="postalCode" className="text-xs font-medium text-gray-700">Postcode</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          className="mt-1 h-9"
                          placeholder="1234AB"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="city" className="text-xs font-medium text-gray-700">Plaats</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="mt-1 h-9"
                          placeholder="Plaats"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Onderwijsgegevens
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="academicYear" className="text-xs font-medium text-gray-700">Schooljaar *</Label>
                        <Select 
                          value={formData.academicYear} 
                          onValueChange={(value) => handleSelectChange('academicYear', value)}
                        >
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue placeholder="Selecteer schooljaar" />
                          </SelectTrigger>
                          <SelectContent>
                            {academicYears.filter((year: any) => year.isActive).map((year: any) => (
                              <SelectItem key={year.id} value={year.name}>
                                {year.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="studentGroupId" className="text-xs font-medium text-gray-700">Klas</Label>
                        <Select 
                          value={formData.studentGroupId} 
                          onValueChange={(value) => handleSelectChange('studentGroupId', value)}
                        >
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue placeholder="Selecteer klas" />
                          </SelectTrigger>
                          <SelectContent>
                            {(classes as StudentClass[]).map((group: StudentClass) => (
                              <SelectItem key={group.id} value={group.id.toString()}>
                                {group.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Aanvullende Informatie
                    </h3>
                    <div>
                      <Label htmlFor="notes" className="text-xs font-medium text-gray-700">Opmerkingen</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="mt-1 min-h-[80px] resize-none"
                        placeholder="Voeg hier eventuele opmerkingen of aantekeningen toe..."
                      />
                    </div>
                  </div>

                </div>
                
                <div className="space-y-4">
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <Camera className="h-4 w-4 mr-2" />
                      Profielfoto
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <div className="relative">
                          <Avatar 
                            className="h-24 w-24 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => document.getElementById('photo')?.click()}
                          >
                            {photoPreview ? (
                              <AvatarImage src={photoPreview} alt="Preview" />
                            ) : (
                              <AvatarFallback className="bg-gray-100 text-gray-400">
                                <Camera className="h-8 w-8" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                            <Camera className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Klik op de foto om te uploaden</p>
                        <Input
                          id="photo"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                        <p className="text-xs text-gray-500">
                          Maximaal 5MB, JPG/PNG
                        </p>
                      </div>
                      
                      <div className="border-t pt-3 flex justify-center">
                        <button
                          type="button"
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={handleEidScan}
                        >
                          <img 
                            src={eidLogoPath} 
                            alt="eID" 
                            className="h-8 w-auto"
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Betaalstatus
                    </h3>
                    <div>
                      <Label htmlFor="paymentStatus" className="text-xs font-medium text-gray-700">Status</Label>
                      <Select 
                        value={formData.paymentStatus} 
                        onValueChange={(value) => handleSelectChange('paymentStatus', value)}
                      >
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue placeholder="Selecteer status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="paid">Betaald</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Voogd Koppeling
                    </h3>
                    <div>
                      <Label htmlFor="guardianId" className="text-xs font-medium text-gray-700">Voogd selecteren</Label>
                      <Select value={formData.guardianId} onValueChange={(value) => handleSelectChange('guardianId', value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecteer een voogd..." />
                        </SelectTrigger>
                        <SelectContent>
                          {guardians.map((guardian) => (
                            <SelectItem key={guardian.id} value={guardian.id.toString()}>
                              {guardian.firstName} {guardian.lastName} - {guardian.relationship}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Broers/Zussen Koppeling
                    </h3>
                    <div className="space-y-2">
                      {potentialSiblings.length > 0 ? (
                        <>
                          <Label className="text-xs font-medium text-gray-700">
                            Gevonden studenten met dezelfde achternaam:
                          </Label>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {potentialSiblings.map((sibling) => (
                              <div key={sibling.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`sibling-${sibling.id}`}
                                  checked={formData.selectedSiblings.includes(sibling.id)}
                                  onChange={() => handleSiblingToggle(sibling.id)}
                                  className="rounded border-gray-300"
                                />
                                <Label htmlFor={`sibling-${sibling.id}`} className="text-xs cursor-pointer">
                                  {sibling.firstName} {sibling.lastName} ({sibling.studentId})
                                </Label>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">
                            Voer een achternaam in om potentiële broers/zussen te vinden
                          </p>
                        </div>
                      )}
                    </div>
                  </div>


                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-3 flex justify-end gap-2 border-t">
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
                disabled={createStudentMutation.isPending}
                className="bg-[#1e40af] hover:bg-[#1d3a9e] text-white"
              >
                <User className="h-4 w-4 mr-2" />
                {createStudentMutation.isPending ? 'Student toevoegen...' : 'Student toevoegen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Student Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                    {selectedStudent.firstName.charAt(0)}{selectedStudent.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <p className="text-gray-600">ID: {selectedStudent.studentId}</p>
                  <Badge
                    variant={selectedStudent.status === 'active' ? 'default' : 'secondary'}
                    className={
                      selectedStudent.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {selectedStudent.status === 'active' ? 'Actief' : 'In behandeling'}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">E-mail:</span>
                  <p className="text-gray-600">{selectedStudent.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Telefoon:</span>
                  <p className="text-gray-600">{selectedStudent.phone}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Geboortedatum:</span>
                  <p className="text-gray-600">{selectedStudent.dateOfBirth}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Klas:</span>
                  <p className="text-gray-600">{selectedStudent.className || 'Niet toegewezen'}</p>
                </div>
              </div>

              {/* Broers/Zussen Sectie */}
              <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Broers/Zussen
                </h3>
                
                {/* Bestaande broers/zussen */}
                {studentSiblings.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    <Label className="text-xs font-medium text-gray-700">
                      Huidige broers/zussen:
                    </Label>
                    <div className="space-y-1">
                      {studentSiblings.map((sibling) => (
                        <div key={sibling.id} className="flex items-center justify-between bg-white p-2 rounded border">
                          <span className="text-xs">
                            {sibling.firstName} {sibling.lastName} ({sibling.studentId})
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSiblingMutation.mutate({ 
                              studentId: selectedStudent.id, 
                              siblingId: sibling.id 
                            })}
                            disabled={removeSiblingMutation.isPending}
                            className="text-red-600 hover:text-red-800 h-6 w-6 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mb-3">Geen broers/zussen gekoppeld</p>
                )}

                {/* Zoek en voeg broers/zussen toe */}
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <Label className="text-sm font-medium text-blue-800 flex items-center gap-2 mb-2">
                      <Search className="h-4 w-4" />
                      Zoek Student
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="text"
                        placeholder="Zoek op voornaam, achternaam of student ID..."
                        value={siblingSearchTerm}
                        onChange={(e) => setSiblingSearchTerm(e.target.value)}
                        className="pl-10 text-sm h-9 border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                      />
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Typ om alle studenten in het systeem te doorzoeken
                    </p>
                  </div>
                  
                  {/* Search Results */}
                  <div className="border border-gray-200 rounded-md bg-white">
                    {searchableSiblings.length > 0 ? (
                      <div className="divide-y divide-gray-100 max-h-40 overflow-y-auto">
                        <div className="px-3 py-2 bg-gray-50 border-b">
                          <p className="text-xs font-medium text-gray-700">
                            {searchableSiblings.filter(sibling => !studentSiblings.some(existing => existing.id === sibling.id)).length} studenten gevonden
                          </p>
                        </div>
                        {searchableSiblings
                          .filter(sibling => !studentSiblings.some(existing => existing.id === sibling.id))
                          .map((sibling) => (
                          <div key={sibling.id} className="flex items-center justify-between p-3 hover:bg-blue-25 transition-colors">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {sibling.firstName} {sibling.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Student ID: {sibling.studentId}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addSiblingMutation.mutate({ 
                                studentId: selectedStudent.id, 
                                siblingId: sibling.id 
                              })}
                              disabled={addSiblingMutation.isPending}
                              className="text-green-600 hover:text-green-800 hover:bg-green-50 h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : siblingSearchTerm.trim() !== '' ? (
                      <div className="text-center py-6">
                        <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-1">Geen resultaten gevonden</p>
                        <p className="text-xs text-gray-400">
                          Probeer een andere zoekterm voor "{siblingSearchTerm}"
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-1">Begin met typen om te zoeken</p>
                        <p className="text-xs text-gray-400">
                          Zoek op naam of student ID om studenten te vinden
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Popup */}
      {invoiceDetails && createdStudent && (
        <InvoicePopup
          isOpen={isInvoicePopupOpen}
          onClose={() => {
            setIsInvoicePopupOpen(false);
            setInvoiceDetails(null);
            setCreatedStudent(null);
          }}
          invoice={invoiceDetails}
          student={createdStudent}
        />
      )}
    </div>
  );
}