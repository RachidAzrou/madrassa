import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { 
  Search, PlusCircle, Filter, Download, Users, User, Camera,
  Fingerprint, ChevronRight, Edit, Trash2, Eye, Home, X,
  GraduationCap, NotebookText, MapPin, FileEdit, Upload, FileDown,
  ArrowDownToLine, ArrowUpToLine, Info, UserPlus, UserCheck, HeartPulse,
  Mail, Save, FileText, Calendar, Phone, AlertTriangle, Plus, Link2,
  MoreHorizontal
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  status: string;
  programId?: number;
  enrollmentDate?: string;
  photoUrl?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  gender?: string;
  notes?: string;
}

export default function TeacherStudents() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fetch students data
  const { data: studentsData = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students'],
  });

  // Filter students based on search and status
  const filteredStudents = (studentsData as Student[]).filter(student => {
    const matchesSearch = 
      student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsEditDialogOpen(true);
  };

  const handleDeleteStudent = (student: Student) => {
    // Delete functionality
    console.log('Delete student:', student);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actief</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactief</Badge>;
      case 'graduated':
        return <Badge className="bg-blue-100 text-blue-800">Afgestudeerd</Badge>;
      case 'withdrawn':
        return <Badge className="bg-red-100 text-red-800">Teruggetrokken</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      {/* Header - Admin Style */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-[#eff6ff] rounded-lg">
              <Users className="h-6 w-6 text-[#1e40af]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1e40af]">Mijn Studenten</h1>
              <p className="text-sm text-gray-600">Bekijk en beheer studenten in uw klassen</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-[#1e40af] hover:bg-[#1d3a8a] text-white"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Student Toevoegen
            </Button>
          </div>
        </div>
      </div>

      {/* Content Container - Admin Style */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-[#e5e7eb]">
          {/* Search and Actions Bar - Admin Style */}
          <div className="p-4 border-b border-[#e5e7eb]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Zoek studenten op naam, ID of email..."
                  className="pl-10 h-10 border-[#e5e7eb] focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilterOptions(!showFilterOptions)}
                  className="border-[#e5e7eb] hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                
                <Button
                  variant="outline"
                  className="border-[#e5e7eb] hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporteren
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Options */}
          {showFilterOptions && (
            <div className="px-4 py-3 border-b border-[#e5e7eb] bg-gray-50">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="status-filter" className="text-sm font-medium">Status:</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle statussen</SelectItem>
                      <SelectItem value="active">Actief</SelectItem>
                      <SelectItem value="inactive">Inactief</SelectItem>
                      <SelectItem value="graduated">Afgestudeerd</SelectItem>
                      <SelectItem value="withdrawn">Teruggetrokken</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#e5e7eb]">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStudents(filteredStudents.map(s => s.id));
                        } else {
                          setSelectedStudents([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin w-6 h-6 border-2 border-[#1e40af] border-t-transparent rounded-full" />
                        <span className="ml-2 text-gray-600">Laden...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <Users className="h-12 w-12 text-gray-300 mb-2" />
                        <p className="text-gray-500">Geen studenten gevonden</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id} className="border-b border-[#e5e7eb] hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStudents([...selectedStudents, student.id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.photoUrl} />
                            <AvatarFallback className="bg-[#eff6ff] text-[#1e40af]">
                              {student.firstName?.[0]}{student.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {student.studentId}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {student.email}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(student.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acties</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleViewStudent(student)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Bekijken
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditStudent(student)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Bewerken
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteStudent(student)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* View Student Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-[#1e40af]">
              <User className="h-5 w-5 mr-2" />
              Student Details
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedStudent.photoUrl} />
                  <AvatarFallback className="bg-[#eff6ff] text-[#1e40af] text-lg">
                    {selectedStudent.firstName?.[0]}{selectedStudent.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">ID: {selectedStudent.studentId}</p>
                  {getStatusBadge(selectedStudent.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <p className="text-sm text-gray-900">{selectedStudent.email || 'Niet opgegeven'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Telefoon</Label>
                  <p className="text-sm text-gray-900">{selectedStudent.phone || 'Niet opgegeven'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Geboortedatum</Label>
                  <p className="text-sm text-gray-900">
                    {selectedStudent.dateOfBirth 
                      ? format(parseISO(selectedStudent.dateOfBirth), 'dd MMMM yyyy', { locale: nl })
                      : 'Niet opgegeven'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Inschrijfdatum</Label>
                  <p className="text-sm text-gray-900">
                    {selectedStudent.enrollmentDate 
                      ? format(parseISO(selectedStudent.enrollmentDate), 'dd MMMM yyyy', { locale: nl })
                      : 'Niet opgegeven'
                    }
                  </p>
                </div>
              </div>

              {selectedStudent.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Notities</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedStudent.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}