import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, Plus, Download, Filter, Eye, Edit, Trash2, 
  User, Users, School, Phone, Mail, Calendar,
  MapPin, BookMarked, AlertTriangle, Star, BookText,
  Settings, Save, X, Upload, UserPlus, ClipboardCheck,
  LayoutDashboard, MoreHorizontal, PlusCircle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import EmptyState from '@/components/ui/empty-state';
import { PremiumHeader } from '@/components/layout/premium-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Types - exact copy from admin
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
  </div>
);

export default function TeacherStudents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  const { data: studentsData, isLoading } = useQuery<{ students: Student[] }>({
    queryKey: ['/api/students'],
    retry: false,
  });

  const { data: classesData } = useQuery<{ classes: StudentClass[] }>({
    queryKey: ['/api/classes'],
    retry: false,
  });

  const students = studentsData?.students || [];
  const classes = classesData?.classes || [];

  // Filter students based on search term, status, and class
  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchTerm || 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    const matchesClass = classFilter === "all" || student.classId?.toString() === classFilter;

    return matchesSearch && matchesStatus && matchesClass;
  });

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setDialogMode('view');
    setShowDialog(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setDialogMode('edit');
    setShowDialog(true);
  };

  const handleCreateStudent = () => {
    setSelectedStudent(null);
    setDialogMode('create');
    setShowDialog(true);
  };

  const handleDeleteStudent = (student: Student) => {
    if (confirm(`Weet je zeker dat je ${student.firstName} ${student.lastName} wilt verwijderen?`)) {
      // Delete logic would go here
      toast({
        title: "Student verwijderd",
        description: `${student.firstName} ${student.lastName} is succesvol verwijderd.`,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Actief</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactief</Badge>;
      case 'graduated':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Afgestudeerd</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      {/* Premium Header - Exact admin styling */}
      <PremiumHeader
        title="Mijn Studenten"
        description="Beheer studenten in uw klassen"
        icon={Users}
        breadcrumbs={{
          parent: "Docent",
          current: "Studenten"
        }}
      />

      {/* Main Content */}
      <div className="p-6">
        <DataTableContainer>
          <SearchActionBar>
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek studenten..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="active">Actief</SelectItem>
                  <SelectItem value="inactive">Inactief</SelectItem>
                  <SelectItem value="graduated">Afgestudeerd</SelectItem>
                </SelectContent>
              </Select>

              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Klas" />
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

              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </SearchActionBar>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={(checked) => {
                        setSelectedStudents(checked ? filteredStudents.map(s => s.id) : []);
                      }}
                    />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Klas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="w-20">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">Laden...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <EmptyState
                        icon={<Users className="w-12 h-12" />}
                        title="Geen studenten gevonden"
                        description="Er zijn geen studenten die voldoen aan uw zoekcriteria."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow 
                      key={student.id}
                      className={selectedStudents.includes(student.id) ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked) => {
                            setSelectedStudents(prev => 
                              checked 
                                ? [...prev, student.id]
                                : prev.filter(id => id !== student.id)
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {student.firstName[0]}{student.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.firstName} {student.lastName}</div>
                            <div className="text-sm text-muted-foreground">{student.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{student.studentId}</TableCell>
                      <TableCell>{student.className || '-'}</TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{student.phone}</div>
                          {student.guardianName && (
                            <div className="text-muted-foreground">Voogd: {student.guardianName}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
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
      </div>
    </div>
  );
}