import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Download, Filter, Eye, Edit, Trash2, 
  User, Users, GraduationCap, Phone, Mail, Calendar,
  MapPin, FileText, AlertTriangle, Star, BookOpen,
  Settings, Save, X, Upload, UserPlus, NotebookText,
  Home, MoreHorizontal, PlusCircle, ClipboardCheck,
  TrendingUp, Award, Clock, RefreshCw, CheckCircle,
  XCircle, AlertCircle, Zap
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/queryClient';

// Types
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
  finalGrade?: number;
  reEnrollmentStatus: 'eligible' | 'enrolled' | 'declined' | 'pending';
}

interface Class {
  id: number;
  name: string;
  academicYearId: number;
  academicYear: string;
}

interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

interface ReEnrollmentStats {
  totalEligible: number;
  passedStudents: number;
  retakeStudents: number;
  conversionRate: number;
}

export default function ReEnrollments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  // Data fetching
  const { data: eligibleStudents = [], isLoading } = useQuery({
    queryKey: ['/api/students/eligible-for-reenrollment'],
    retry: false,
  });

  const { data: nextYearClasses = [] } = useQuery({
    queryKey: ['/api/classes/next-year'],
  });

  const { data: stats } = useQuery<{ stats: ReEnrollmentStats }>({
    queryKey: ['/api/re-enrollment/stats'],
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: ['/api/academic-years'],
  });

  // Mutations
  const bulkReEnrollMutation = useMutation({
    mutationFn: async (data: { studentIds: number[], targetAcademicYearId: number, targetClassId?: number }) => {
      return apiRequest('POST', '/api/re-enrollments/bulk', data);
    },
    onSuccess: () => {
      toast({
        title: "Herinschrijvingen voltooid",
        description: "De geselecteerde leerlingen zijn succesvol heringeschreven.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students/eligible-for-reenrollment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/re-enrollment/stats'] });
      setSelectedStudents([]);
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij herinschrijven",
        description: error.message || "Er is een fout opgetreden bij het herinschrijven.",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleBulkReEnroll = () => {
    if (selectedStudents.length === 0) return;
    
    // For now, use the first available academic year
    const targetAcademicYear = academicYears[0];
    if (!targetAcademicYear) {
      toast({
        title: "Geen academisch jaar",
        description: "Er is geen academisch jaar beschikbaar voor herinschrijving.",
        variant: "destructive",
      });
      return;
    }

    bulkReEnrollMutation.mutate({
      studentIds: selectedStudents,
      targetAcademicYearId: targetAcademicYear.id,
    });
  };

  const handleSelectStudent = (studentId: number) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === eligibleStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(eligibleStudents.map((student: Student) => student.id));
    }
  };

  // Filtering
  const filteredStudents = eligibleStudents.filter((student: Student) => {
    const matchesSearch = searchTerm === '' || 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || student.reEnrollmentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Herinschrijvingen</h1>
          <p className="text-gray-600">Beheer herinschrijvingen voor het nieuwe schooljaar</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/students/eligible-for-reenrollment'] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Vernieuwen
          </Button>
          <Button 
            onClick={handleBulkReEnroll}
            disabled={selectedStudents.length === 0 || bulkReEnrollMutation.isPending}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Bulk Herinschrijven ({selectedStudents.length})
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totaal Geschikt</p>
                <p className="text-2xl font-bold">{stats?.stats?.totalEligible || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Geslaagd</p>
                <p className="text-2xl font-bold text-green-600">{stats?.stats?.passedStudents || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Herexamen</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.stats?.retakeStudents || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Omzettingspercentage</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.stats?.conversionRate || 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Zoeken op naam, leerlingnummer of email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="eligible">Geschikt</SelectItem>
                  <SelectItem value="enrolled">Ingeschreven</SelectItem>
                  <SelectItem value="declined">Afgewezen</SelectItem>
                  <SelectItem value="pending">In behandeling</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Academisch jaar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle jaren</SelectItem>
                  {academicYears.map((year: AcademicYear) => (
                    <SelectItem key={year.id} value={year.id.toString()}>{year.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Herinschrijvingen</CardTitle>
          <CardDescription>{filteredStudents.length} leerlingen geschikt voor herinschrijving</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Leerling</TableHead>
                <TableHead>Leerlingnummer</TableHead>
                <TableHead>Huidige Klas</TableHead>
                <TableHead>Eindcijfer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Voogd</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student: Student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={() => handleSelectStudent(student.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{student.firstName} {student.lastName}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{student.studentId}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{student.className || 'Geen klas'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span className={`font-medium ${
                        (student.finalGrade || 0) >= 6 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {student.finalGrade || 'N/A'}
                      </span>
                      {(student.finalGrade || 0) >= 6 && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      student.reEnrollmentStatus === 'eligible' ? 'default' :
                      student.reEnrollmentStatus === 'enrolled' ? 'secondary' :
                      student.reEnrollmentStatus === 'declined' ? 'destructive' : 'outline'
                    }>
                      {student.reEnrollmentStatus === 'eligible' ? 'Geschikt' :
                       student.reEnrollmentStatus === 'enrolled' ? 'Ingeschreven' :
                       student.reEnrollmentStatus === 'declined' ? 'Afgewezen' : 'In behandeling'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-900">{student.guardianName || 'Niet beschikbaar'}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Details bekijken</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Herinschrijven</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredStudents.length === 0 && (
            <div className="p-8 text-center">
              <EmptyState
                icon={<GraduationCap className="h-12 w-12" />}
                title="Geen leerlingen gevonden"
                description="Er zijn geen leerlingen die voldoen aan de zoekfilters of geschikt zijn voor herinschrijving."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}