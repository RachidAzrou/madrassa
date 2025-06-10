import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  RefreshCw, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Download,
  Upload,
  GraduationCap,
  School,
  Calendar,
  TrendingUp,
  UserCheck,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';


interface Student {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  email?: string;
  phone?: string;
  className?: string;
  status: string;
  currentYear: string;
  gpa?: number;
  attendance?: number;
  photoUrl?: string;
  enrollmentStatus?: 'eligible' | 'enrolled' | 'not_eligible' | 'pending';
}

interface ReEnrollmentStats {
  totalStudents: number;
  eligibleStudents: number;
  enrolledStudents: number;
  pendingStudents: number;
  completionRate: number;
}

export default function ReEnrollments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [isBulkEnrollDialogOpen, setIsBulkEnrollDialogOpen] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025-2026');
  const { toast } = useToast();

  const { data: stats } = useQuery<ReEnrollmentStats>({
    queryKey: ['/api/re-enrollment/stats'],
    staleTime: 30000,
  });

  const { data: eligibleStudents = [], isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students/eligible-for-reenrollment'],
    staleTime: 60000,
  });

  const { data: academicYears = [] } = useQuery({
    queryKey: ['/api/academic-years'],
    staleTime: 300000,
  });

  const bulkEnrollMutation = useMutation({
    mutationFn: async (data: { studentIds: number[]; academicYear: string }) => {
      return apiRequest('POST', '/api/re-enrollments/bulk', data);
    },
    onSuccess: () => {
      toast({
        title: "Herinschrijving Voltooid",
        description: `${selectedStudents.length} studenten succesvol heringeschreven.`,
      });
      setSelectedStudents([]);
      setIsBulkEnrollDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/students/eligible-for-reenrollment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/re-enrollment/stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij Herinschrijving",
        description: error.message || "Er is een fout opgetreden bij het herinschrijven van studenten.",
        variant: "destructive",
      });
    },
  });

  const filteredStudents = eligibleStudents.filter(student => {
    const matchesSearch = 
      student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || student.enrollmentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId: number, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handleBulkEnroll = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "Geen Studenten Geselecteerd",
        description: "Selecteer eerst studenten om herinschrijving uit te voeren.",
        variant: "destructive",
      });
      return;
    }
    setIsBulkEnrollDialogOpen(true);
  };

  const confirmBulkEnroll = () => {
    bulkEnrollMutation.mutate({
      studentIds: selectedStudents,
      academicYear: selectedAcademicYear
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'eligible':
        return <Badge variant="outline" className="text-green-700 border-green-300">Geschikt</Badge>;
      case 'enrolled':
        return <Badge variant="default" className="bg-blue-600">Heringeschreven</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-yellow-700 border-yellow-300">In Behandeling</Badge>;
      case 'not_eligible':
        return <Badge variant="destructive">Niet Geschikt</Badge>;
      default:
        return <Badge variant="outline">Onbekend</Badge>;
    }
  };

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Herinschrijvingen</h1>
            <p className="text-sm text-gray-600">Beheer herinschrijvingen voor het nieuwe schooljaar en bekijk de voortgang van studenten</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Totaal Studenten</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
                </div>
                <Users className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Geschikt voor Herinschrijving</p>
                  <p className="text-2xl font-bold text-green-600">{stats?.eligibleStudents || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Heringeschreven</p>
                  <p className="text-2xl font-bold text-blue-600">{stats?.enrolledStudents || 0}</p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Voltooiingspercentage</p>
                  <p className="text-2xl font-bold text-purple-600">{stats?.completionRate || 0}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Studenten Herinschrijving</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkEnroll}
                  disabled={selectedStudents.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Herinschrijven ({selectedStudents.length})
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exporteren
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Zoek op naam of student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter op status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Statussen</SelectItem>
                  <SelectItem value="eligible">Geschikt</SelectItem>
                  <SelectItem value="enrolled">Heringeschreven</SelectItem>
                  <SelectItem value="pending">In Behandeling</SelectItem>
                  <SelectItem value="not_eligible">Niet Geschikt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Huidige Klas</TableHead>
                    <TableHead>Gemiddeld Cijfer</TableHead>
                    <TableHead>Aanwezigheid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                          <span className="ml-2 text-gray-600">Laden...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <RefreshCw className="h-12 w-12 mb-4 opacity-30" />
                          <p className="text-sm font-medium">Geen studenten gevonden</p>
                          <p className="text-xs text-gray-400">
                            {searchTerm || statusFilter !== 'all' 
                              ? 'Pas je zoekcriteria aan om meer resultaten te zien.'
                              : 'Er zijn momenteel geen studenten beschikbaar voor herinschrijving.'
                            }
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.photoUrl} />
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                {student.firstName?.[0]}{student.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{student.firstName} {student.lastName}</p>
                              <p className="text-xs text-gray-500">{student.studentId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{student.className || '-'}</TableCell>
                        <TableCell className="text-sm">
                          {student.gpa ? (
                            <span className={`font-medium ${student.gpa >= 7.5 ? 'text-green-600' : student.gpa >= 6.0 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {student.gpa.toFixed(1)}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {student.attendance ? (
                            <span className={`font-medium ${student.attendance >= 80 ? 'text-green-600' : student.attendance >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {student.attendance}%
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(student.enrollmentStatus || 'eligible')}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <FileText className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Enrollment Dialog */}
      <Dialog open={isBulkEnrollDialogOpen} onOpenChange={setIsBulkEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Herinschrijving Bevestigen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Je staat op het punt om <strong>{selectedStudents.length} studenten</strong> herinschrijving uit te voeren 
              voor het schooljaar <strong>{selectedAcademicYear}</strong>.
            </p>
            <div>
              <Label htmlFor="academic-year">Schooljaar</Label>
              <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                  <SelectItem value="2026-2027">2026-2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <AlertTriangle className="h-4 w-4 inline mr-2" />
                Deze actie kan niet ongedaan worden gemaakt. Alle geselecteerde studenten worden heringeschreven.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkEnrollDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={confirmBulkEnroll}
              disabled={bulkEnrollMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {bulkEnrollMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Verwerken...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Herinschrijven
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}