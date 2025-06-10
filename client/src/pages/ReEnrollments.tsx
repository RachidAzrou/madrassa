import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, Plus, Download, Filter, Eye, Edit, Trash2, 
  User, Users, GraduationCap, Phone, Mail, Calendar,
  MapPin, FileText, AlertTriangle, Star, BookOpen,
  Settings, Save, X, Upload, UserPlus, NotebookText,
  Home, MoreHorizontal, PlusCircle, ClipboardCheck,
  TrendingUp, Award, Clock, RefreshCw, CheckCircle,
  XCircle, Loader2
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

// Types
interface EligibleStudent {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentClass: string;
  currentAcademicYear: string;
  nextClass: string;
  nextAcademicYear: string;
  status: string;
  guardianName: string;
  guardianEmail: string;
  lastEnrollmentDate: string;
  photoUrl?: string;
}

interface ReEnrollmentStats {
  totalEligible: number;
  passedStudents: number;
  failedStudents: number;
  enrolled: number;
  pending: number;
  completed: number;
}

interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface Class {
  id: number;
  name: string;
  academicYearId: number;
  level: number;
  capacity: number;
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

export default function ReEnrollments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch eligible students
  const { data: eligibleStudents = [], isLoading } = useQuery<EligibleStudent[]>({
    queryKey: ['/api/students/eligible-for-reenrollment']
  });

  // Fetch re-enrollment stats
  const { data: stats } = useQuery<ReEnrollmentStats>({
    queryKey: ['/api/re-enrollment/stats']
  });

  // Fetch academic years for next year options
  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ['/api/academic-years']
  });

  // Fetch classes for next year
  const { data: nextYearClasses = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes/next-year']
  });

  // Bulk re-enrollment mutation
  const bulkEnrollMutation = useMutation({
    mutationFn: async (enrollmentData: any) => {
      return apiRequest('POST', '/api/re-enrollments/bulk', enrollmentData);
    },
    onSuccess: () => {
      toast({
        title: "Herinschrijvingen voltooid",
        description: `${selectedStudents.length} leerlingen zijn succesvol heringeschreven.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students/eligible-for-reenrollment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/re-enrollment/stats'] });
      setSelectedStudents([]);
      setShowBulkDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij herinschrijving",
        description: error.message || "Er is een fout opgetreden bij het herinschrijven van leerlingen.",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map(student => student.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId: number, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleBulkEnroll = () => {
    setShowBulkDialog(true);
  };

  const processBulkEnrollment = () => {
    const nextAcademicYear = academicYears.find(year => !year.isActive);
    if (!nextAcademicYear) {
      toast({
        title: "Geen volgend schooljaar",
        description: "Er is geen volgend schooljaar gedefinieerd.",
        variant: "destructive",
      });
      return;
    }

    const enrollmentData = {
      studentIds: selectedStudents,
      academicYearId: nextAcademicYear.id,
      enrollmentDate: new Date().toISOString(),
    };

    bulkEnrollMutation.mutate(enrollmentData);
  };

  const filteredStudents = eligibleStudents.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;
    const matchesClass = selectedClass === 'all' || student.currentClass === selectedClass;
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  if (isLoading) {
    return (
      <div className="px-6 py-6 flex-1 overflow-visible">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-6 flex-1 overflow-visible">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Herinschrijvingen</h1>
        <p className="text-gray-600">Beheer herinschrijvingen voor het nieuwe schooljaar</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Geschikt</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEligible || 0}</div>
            <p className="text-xs text-muted-foreground">
              Leerlingen geschikt voor herinschrijving
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geslaagd</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.passedStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Automatisch doorgestroomd
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Herexamen</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.failedStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Vereist herexamen
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heringeschreven</CardTitle>
            <RefreshCw className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.enrolled || 0}</div>
            <p className="text-xs text-muted-foreground">
              Al heringeschreven
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <DataTableContainer>
        <SearchActionBar>
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Zoeken op naam, leerlingnummer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="passed">Geslaagd</SelectItem>
                <SelectItem value="failed">Herexamen</SelectItem>
                <SelectItem value="enrolled">Heringeschreven</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Huidige klas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle klassen</SelectItem>
                <SelectItem value="1A">1A</SelectItem>
                <SelectItem value="1B">1B</SelectItem>
                <SelectItem value="2A">2A</SelectItem>
                <SelectItem value="2B">2B</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedStudents.length > 0 && (
              <Button 
                onClick={handleBulkEnroll} 
                size="sm" 
                className="h-9"
                disabled={bulkEnrollMutation.isPending}
              >
                {bulkEnrollMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Herinschrijven ({selectedStudents.length})
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-9">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </SearchActionBar>

        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#e5e7eb]">
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Leerling</TableHead>
                <TableHead>Leerlingnummer</TableHead>
                <TableHead>Huidige Klas</TableHead>
                <TableHead>Volgende Klas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Voogd</TableHead>
                <TableHead>Laatste Inschrijving</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id} className="border-b border-[#f3f4f6] hover:bg-gray-50/50">
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
                        <AvatarFallback className="text-xs">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{student.studentId}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{student.currentClass}</span>
                    <div className="text-xs text-gray-500">{student.currentAcademicYear}</div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{student.nextClass}</span>
                    <div className="text-xs text-gray-500">{student.nextAcademicYear}</div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        student.status === 'passed' ? 'default' : 
                        student.status === 'failed' ? 'secondary' : 
                        student.status === 'enrolled' ? 'outline' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {student.status === 'passed' ? 'Geslaagd' : 
                       student.status === 'failed' ? 'Herexamen' : 
                       student.status === 'enrolled' ? 'Heringeschreven' : student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{student.guardianName}</div>
                      <div className="text-xs text-gray-500">{student.guardianEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {new Date(student.lastEnrollmentDate).toLocaleDateString('nl-NL')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleSelectStudent(student.id, !selectedStudents.includes(student.id))}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Herinschrijven</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredStudents.length === 0 && (
          <div className="p-8">
            <EmptyState
              icon={<RefreshCw className="h-12 w-12" />}
              title="Geen leerlingen gevonden"
              description="Er zijn geen leerlingen die voldoen aan de zoekfilters of geschikt zijn voor herinschrijving."
            />
          </div>
        )}
      </DataTableContainer>

      {/* Bulk Enrollment Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Herinschrijving</DialogTitle>
            <DialogDescription>
              Je staat op het punt {selectedStudents.length} leerlingen in te schrijven voor het nieuwe schooljaar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Schooljaar</Label>
              <p className="text-sm text-gray-600">
                {academicYears.find(year => !year.isActive)?.name || 'Nieuw schooljaar'}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Inschrijvingsdatum</Label>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('nl-NL')}
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Let op</p>
                  <p className="text-yellow-700">
                    Deze actie kan niet ongedaan worden gemaakt. Zorg ervoor dat alle geselecteerde leerlingen correct zijn.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={processBulkEnrollment}
              disabled={bulkEnrollMutation.isPending}
            >
              {bulkEnrollMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Bezig...
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