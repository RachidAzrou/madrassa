import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Download, Filter, Eye, Edit, Trash2, 
  User, Users, GraduationCap, Phone, Mail, Calendar,
  MapPin, FileText, AlertTriangle, Star, BookOpen,
  Settings, Save, X, Upload, UserPlus, NotebookText,
  Home, MoreHorizontal, PlusCircle, ClipboardCheck,
  TrendingUp, Award, Clock, RefreshCw, CheckCircle,
  XCircle, AlertCircle, Zap, RotateCcw
} from 'lucide-react';
import { PremiumHeader } from "@/components/layout/premium-header";
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [targetAcademicYear, setTargetAcademicYear] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: eligibleStudents = [], isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students/eligible-for-reenrollment'],
    staleTime: 60000,
  });

  const { data: nextYearClasses = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes/next-year'],
    staleTime: 60000,
  });

  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ['/api/academic-years'],
    staleTime: 60000,
  });

  const { data: stats } = useQuery<{ stats: ReEnrollmentStats }>({
    queryKey: ['/api/re-enrollment/stats'],
    staleTime: 60000,
  });

  // Bulk re-enrollment mutation
  const bulkReEnrollMutation = useMutation({
    mutationFn: async (data: { studentIds: number[], academicYearId: number }) => {
      const response = await fetch('/api/re-enrollments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to re-enroll students');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Herinschrijving Succesvol",
        description: `${selectedStudents.length} leerlingen zijn succesvol heringeschreven.`,
      });
      setSelectedStudents([]);
      queryClient.invalidateQueries({ queryKey: ['/api/students/eligible-for-reenrollment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/re-enrollment/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Herinschrijving Mislukt",
        description: error.message || "Er is een fout opgetreden bij het herinschrijven van leerlingen.",
        variant: "destructive",
      });
    },
  });

  const handleBulkReEnroll = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "Geen Leerlingen Geselecteerd",
        description: "Selecteer eerst leerlingen om opnieuw in te schrijven.",
        variant: "destructive",
      });
      return;
    }

    if (!targetAcademicYear) {
      toast({
        title: "Geen Schooljaar Geselecteerd",
        description: "Selecteer eerst een doelschooljaar.",
        variant: "destructive",
      });
      return;
    }

    bulkReEnrollMutation.mutate({
      studentIds: selectedStudents,
      academicYearId: parseInt(targetAcademicYear)
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === eligibleStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(eligibleStudents.map((student: Student) => student.id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const filteredStudents = eligibleStudents.filter((student: Student) => {
    const matchesSearch = searchTerm === '' || 
      student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || student.reEnrollmentStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const currentStats = stats?.stats || {
    totalEligible: 0,
    passedStudents: 0,
    retakeStudents: 0,
    conversionRate: 0
  };

  return (
    <div>
      <PremiumHeader 
        title="Herinschrijvingen" 
        icon={RotateCcw}
        description="Beheer herinschrijvingen voor het nieuwe schooljaar"
        breadcrumbs={{
          parent: "Beheer",
          current: "Herinschrijvingen"
        }}
      />
      
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Totaal Geschikt</p>
                  <p className="text-2xl font-bold">{currentStats.totalEligible}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Geslaagden</p>
                  <p className="text-2xl font-bold">{currentStats.passedStudents}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Herkansers</p>
                  <p className="text-2xl font-bold">{currentStats.retakeStudents}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversiepercentage</p>
                  <p className="text-2xl font-bold">{currentStats.conversionRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Zoek leerlingen op naam of student ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter op status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle statussen</SelectItem>
                    <SelectItem value="eligible">Geschikt</SelectItem>
                    <SelectItem value="enrolled">Ingeschreven</SelectItem>
                    <SelectItem value="declined">Afgewezen</SelectItem>
                    <SelectItem value="pending">In behandeling</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={targetAcademicYear} onValueChange={setTargetAcademicYear}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Selecteer schooljaar" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year: AcademicYear) => (
                      <SelectItem key={year.id} value={year.id.toString()}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Geschikte Leerlingen voor Herinschrijving</CardTitle>
            <CardDescription>
              Selecteer leerlingen die u wilt herinschrijven voor het nieuwe schooljaar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStudents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStudents.length === filteredStudents.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Leerling</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Huidige Klas</TableHead>
                    <TableHead>Eindcijfer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Voogd</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
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
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.firstName}`} />
                            <AvatarFallback>
                              {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.firstName} {student.lastName}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={GraduationCap}
                title="Geen leerlingen gevonden"
                description="Er zijn geen leerlingen die voldoen aan de zoekfilters of geschikt zijn voor herinschrijving."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}