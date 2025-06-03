import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { 
  Search, 
  Filter, 
  RefreshCw,
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  GraduationCap,
  Settings,
  Award,
  AlertTriangle,
  Plus,
  Download,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { PremiumHeader } from '@/components/layout/premium-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { 
  DataTableContainer, 
  SearchActionBar, 
  TableContainer,
  DataTableHeader,
  TableLoadingState,
  EmptyTableState,
  QuickActions
} from "@/components/ui/data-table-container";

interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  currentClass: string;
  currentProgram: string;
  isPassed: boolean;
  finalGrade: number;
  attendancePercentage: number;
  promotionEligible: boolean;
}

interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  registrationStartDate: string;
  registrationEndDate: string;
  finalReportDate: string;
}

interface Class {
  id: number;
  name: string;
  academicYear: string;
  programId: number;
}

interface ReEnrollmentData {
  studentId: number;
  toClassId: number;
  toProgramId: number;
  isPromotion: boolean;
  notes?: string;
}

export default function ReEnrollment() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showAcademicYearDialog, setShowAcademicYearDialog] = useState(false);
  const [bulkEnrollmentData, setBulkEnrollmentData] = useState<Partial<ReEnrollmentData>>({});

  // Data queries
  const { data: currentAcademicYear } = useQuery({
    queryKey: ['/api/academic-years/current'],
    select: (data: any) => data || null
  });

  const { data: studentsData = [], isLoading: studentsLoading } = useQuery({ 
    queryKey: ['/api/students/eligible-for-reenrollment'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  const { data: classesData = [] } = useQuery({ 
    queryKey: ['/api/classes/next-year'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  const { data: academicYearsData = [] } = useQuery({ 
    queryKey: ['/api/academic-years'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  const { data: reEnrollmentStats = {
    totalEligible: 0,
    passedStudents: 0,
    failedStudents: 0,
    enrolledStudents: 0,
    pendingEnrollments: 0
  } } = useQuery({
    queryKey: ['/api/re-enrollment/stats'],
    select: (data: any) => data || {
      totalEligible: 0,
      passedStudents: 0,
      failedStudents: 0,
      enrolledStudents: 0,
      pendingEnrollments: 0
    }
  });

  // Mutations
  const bulkEnrollMutation = useMutation({
    mutationFn: async (enrollmentData: ReEnrollmentData[]) => {
      const response = await fetch('/api/re-enrollments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollments: enrollmentData })
      });
      if (!response.ok) throw new Error('Failed to enroll students');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Succes", description: "Studenten succesvol heringeschreven" });
      queryClient.invalidateQueries({ queryKey: ['/api/students/eligible-for-reenrollment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/re-enrollment/stats'] });
      setShowBulkDialog(false);
      setSelectedStudents([]);
    },
    onError: () => {
      toast({ title: "Fout", description: "Er ging iets mis bij het herinschrijven", variant: "destructive" });
    }
  });

  // Check if registration period is active
  const canStartRegistration = currentAcademicYear ? 
    new Date() >= new Date(currentAcademicYear.finalReportDate) : false;

  // Filter functions
  const filteredStudents = studentsData.filter((student: Student) => {
    const matchesSearch = student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "passed" && student.isPassed) ||
                         (statusFilter === "failed" && !student.isPassed);

    return matchesSearch && matchesStatus;
  });

  const passedStudents = filteredStudents.filter((s: Student) => s.isPassed && s.promotionEligible);
  const failedStudents = filteredStudents.filter((s: Student) => !s.isPassed);

  const handleSelectStudent = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = (students: Student[]) => {
    const studentIds = students.map(s => s.id);
    if (selectedStudents.length === studentIds.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(studentIds);
    }
  };

  const handleBulkEnrollment = () => {
    if (selectedStudents.length === 0) {
      toast({ title: "Fout", description: "Selecteer eerst studenten voor herinschrijving" });
      return;
    }
    setShowBulkDialog(true);
  };

  const confirmBulkEnrollment = () => {
    const enrollmentData = selectedStudents.map(studentId => ({
      studentId,
      toClassId: bulkEnrollmentData.toClassId!,
      toProgramId: bulkEnrollmentData.toProgramId!,
      isPromotion: bulkEnrollmentData.isPromotion ?? true,
      notes: bulkEnrollmentData.notes || ''
    }));

    bulkEnrollMutation.mutate(enrollmentData);
  };

  const getStatusBadge = (student: Student) => {
    if (student.isPassed && student.promotionEligible) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Geslaagd</Badge>;
    } else if (!student.isPassed) {
      return <Badge variant="destructive">Gezakt</Badge>;
    } else {
      return <Badge variant="secondary">Onder Evaluatie</Badge>;
    }
  };

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      <PremiumHeader 
        title="Herinschrijvingen" 
        description={`Beheer student herinschrijvingen voor het schooljaar ${currentAcademicYear?.name || '2024-2025'}`}
        icon={RefreshCw}
        breadcrumbs={{
          parent: "Evaluatie",
          current: "Herinschrijvingen"
        }}
      />

      {/* Statistics Cards */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Totaal Geschikt</p>
                  <p className="text-2xl font-bold text-gray-900">{reEnrollmentStats.totalEligible}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Geslaagd</p>
                  <p className="text-2xl font-bold text-gray-900">{reEnrollmentStats.passedStudents}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gezakt</p>
                  <p className="text-2xl font-bold text-gray-900">{reEnrollmentStats.failedStudents}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingeschreven</p>
                  <p className="text-2xl font-bold text-gray-900">{reEnrollmentStats.enrolledStudents}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Behandeling</p>
                  <p className="text-2xl font-bold text-gray-900">{reEnrollmentStats.pendingEnrollments}</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registration Status Alert */}
        {!canStartRegistration && (
          <Card className="border-amber-200 bg-amber-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-medium text-amber-800">Herinschrijving Nog Niet Beschikbaar</h3>
                  <p className="text-sm text-amber-700">
                    Herinschrijvingen worden beschikbaar na de eindrapport datum: {currentAcademicYear?.finalReportDate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <DataTableContainer>
        <SearchActionBar>
          {/* Search Bar */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Zoek op naam of student ID..."
              className="w-full pl-9 h-8 text-xs rounded-sm bg-white border-[#e5e7eb]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterOptions(!showFilterOptions)}
              className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
              title="Filters"
            >
              <Filter className="h-3.5 w-3.5" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAcademicYearDialog(true)}
              className="h-7 px-2 rounded-sm border-[#e5e7eb] text-xs"
              title="Schooljaar Beheer"
            >
              <Settings className="h-3.5 w-3.5 mr-1" />
              Schooljaar
            </Button>

            {selectedStudents.length > 0 && (
              <Button
                size="sm"
                onClick={handleBulkEnrollment}
                className="h-7 px-3 rounded-sm text-xs bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Bulk Inschrijven ({selectedStudents.length})
              </Button>
            )}
          </div>
        </SearchActionBar>

        {/* Filter Options */}
        {showFilterOptions && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Studenten</SelectItem>
                    <SelectItem value="passed">Geslaagd</SelectItem>
                    <SelectItem value="failed">Gezakt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        <DataTableHeader 
          title="Herinschrijvingen Overzicht"
          subtitle={`${filteredStudents.length} studenten geschikt voor herinschrijving`}
        />

        <TableContainer>
          <Tabs defaultValue="passed" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="passed">
                Geslaagde Studenten ({passedStudents.length})
              </TabsTrigger>
              <TabsTrigger value="failed">
                Gezakte Studenten ({failedStudents.length})
              </TabsTrigger>
            </TabsList>

            {/* Passed Students Tab */}
            <TabsContent value="passed">
              {studentsLoading ? (
                <TableLoadingState />
              ) : passedStudents.length === 0 ? (
                <EmptyTableState 
                  icon={CheckCircle}
                  title="Geen geslaagde studenten"
                  description="Er zijn momenteel geen studenten die geslaagd zijn en geschikt zijn voor herinschrijving."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedStudents.length === passedStudents.length}
                          onCheckedChange={() => handleSelectAll(passedStudents)}
                        />
                      </TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Huidige Klas</TableHead>
                      <TableHead>Programma</TableHead>
                      <TableHead>Eindcijfer</TableHead>
                      <TableHead>Aanwezigheid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passedStudents.map((student: Student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => handleSelectStudent(student.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.firstName} {student.lastName}</div>
                            <div className="text-sm text-gray-500">{student.studentId}</div>
                          </div>
                        </TableCell>
                        <TableCell>{student.currentClass}</TableCell>
                        <TableCell>{student.currentProgram}</TableCell>
                        <TableCell>{student.finalGrade}/10</TableCell>
                        <TableCell>{student.attendancePercentage}%</TableCell>
                        <TableCell>{getStatusBadge(student)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Failed Students Tab */}
            <TabsContent value="failed">
              {studentsLoading ? (
                <TableLoadingState />
              ) : failedStudents.length === 0 ? (
                <EmptyTableState 
                  icon={XCircle}
                  title="Geen gezakte studenten"
                  description="Er zijn momenteel geen studenten die gezakt zijn en individuele behandeling nodig hebben."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Huidige Klas</TableHead>
                      <TableHead>Programma</TableHead>
                      <TableHead>Eindcijfer</TableHead>
                      <TableHead>Aanwezigheid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failedStudents.map((student: Student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.firstName} {student.lastName}</div>
                            <div className="text-sm text-gray-500">{student.studentId}</div>
                          </div>
                        </TableCell>
                        <TableCell>{student.currentClass}</TableCell>
                        <TableCell>{student.currentProgram}</TableCell>
                        <TableCell>{student.finalGrade}/10</TableCell>
                        <TableCell>{student.attendancePercentage}%</TableCell>
                        <TableCell>{getStatusBadge(student)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </TableContainer>
      </DataTableContainer>

      {/* Bulk Enrollment Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Herinschrijving</DialogTitle>
            <DialogDescription>
              Schrijf {selectedStudents.length} geselecteerde studenten in voor het nieuwe schooljaar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nieuwe Klas</label>
              <Select 
                value={bulkEnrollmentData.toClassId?.toString()} 
                onValueChange={(value) => setBulkEnrollmentData(prev => ({ ...prev, toClassId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer nieuwe klas" />
                </SelectTrigger>
                <SelectContent>
                  {classesData.map((cls: Class) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={confirmBulkEnrollment} 
              disabled={!bulkEnrollmentData.toClassId}
            >
              Inschrijven
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Academic Year Management Dialog */}
      <Dialog open={showAcademicYearDialog} onOpenChange={setShowAcademicYearDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Schooljaar Beheer</DialogTitle>
            <DialogDescription>
              Beheer schooljaren, data en vakanties voor herinschrijvingen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Schooljaar beheer functionaliteit wordt binnenkort toegevoegd.</p>
              <p className="text-sm">Hier kun je straks begin/eind data en vakanties instellen.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcademicYearDialog(false)}>
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}