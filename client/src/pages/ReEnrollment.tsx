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
          <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 mb-6 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-900 text-base mb-1">
                    Herinschrijving Nog Niet Beschikbaar
                  </h3>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    Herinschrijvingen worden beschikbaar na de eindrapport datum: 
                    <span className="font-medium ml-1">{currentAcademicYear?.finalReportDate}</span>
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
          <div className="relative w-full sm:max-w-lg">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Zoek op naam, student ID of klas..."
              className="w-full pl-10 h-10 text-sm rounded-lg bg-white border-gray-200 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterOptions(!showFilterOptions)}
              className={`h-9 px-3 rounded-lg border-gray-200 shadow-sm hover:bg-gray-50 transition-colors ${
                showFilterOptions ? 'bg-gray-100 border-gray-300' : ''
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            {selectedStudents.length > 0 && (
              <Button
                size="sm"
                onClick={handleBulkEnrollment}
                className="h-9 px-4 rounded-lg text-sm bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Bulk Inschrijven ({selectedStudents.length})
              </Button>
            )}
          </div>
        </SearchActionBar>

        {/* Filter Options */}
        {showFilterOptions && (
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Status:</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 h-9 text-sm rounded-lg border-gray-200 shadow-sm">
                    <SelectValue placeholder="Selecteer status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Studenten</SelectItem>
                    <SelectItem value="passed">Geslaagd</SelectItem>
                    <SelectItem value="failed">Gezakt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-600">
                {filteredStudents.length} van {reEnrollmentStats?.totalEligible || 0} studenten
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-6 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Herinschrijvingen Overzicht</h2>
              <p className="text-sm text-gray-600">
                {filteredStudents.length} studenten geschikt voor herinschrijving
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Geslaagd: {passedStudents.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Gezakt: {failedStudents.length}</span>
              </div>
            </div>
          </div>
        </div>

        <TableContainer>
          <Tabs defaultValue="passed" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-gray-100 rounded-lg">
              <TabsTrigger 
                value="passed" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                Geslaagde Studenten ({passedStudents.length})
              </TabsTrigger>
              <TabsTrigger 
                value="failed"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md"
              >
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                Gezakte Studenten ({failedStudents.length})
              </TabsTrigger>
            </TabsList>

            {/* Passed Students Tab */}
            <TabsContent value="passed">
              {studentsLoading ? (
                <TableLoadingState />
              ) : passedStudents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <CheckCircle className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Geen geslaagde studenten</h3>
                  <p className="text-gray-500">Er zijn momenteel geen studenten die geslaagd zijn en geschikt zijn voor herinschrijving.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 bg-gray-50/50">
                      <TableHead className="w-12 py-4">
                        <Checkbox
                          checked={selectedStudents.length === passedStudents.length}
                          onCheckedChange={() => handleSelectAll(passedStudents)}
                          className="rounded-md"
                        />
                      </TableHead>
                      <TableHead className="py-4 font-semibold text-gray-900">Student</TableHead>
                      <TableHead className="py-4 font-semibold text-gray-900">Huidige Klas</TableHead>
                      <TableHead className="py-4 font-semibold text-gray-900">Programma</TableHead>
                      <TableHead className="py-4 font-semibold text-gray-900">Eindcijfer</TableHead>
                      <TableHead className="py-4 font-semibold text-gray-900">Aanwezigheid</TableHead>
                      <TableHead className="py-4 font-semibold text-gray-900">Status</TableHead>
                      <TableHead className="text-right py-4 font-semibold text-gray-900">Acties</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {passedStudents.map((student: Student) => (
                      <TableRow key={student.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <TableCell className="py-4">
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => handleSelectStudent(student.id)}
                            className="rounded-md"
                          />
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-xs font-medium text-green-700">
                                {student.firstName?.[0]}{student.lastName?.[0]}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                              <div className="text-sm text-gray-500">{student.studentId}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-gray-700">{student.currentClass}</TableCell>
                        <TableCell className="py-4 text-gray-700">{student.currentProgram}</TableCell>
                        <TableCell className="py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {student.finalGrade}/10
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {student.attendancePercentage}%
                          </span>
                        </TableCell>
                        <TableCell className="py-4">{getStatusBadge(student)}</TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 rounded-md">
                              <Eye className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 rounded-md">
                              <Edit className="h-4 w-4 text-gray-600" />
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
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <XCircle className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Geen gezakte studenten</h3>
                  <p className="text-gray-500">Er zijn momenteel geen studenten die gezakt zijn en individuele behandeling nodig hebben.</p>
                </div>
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


    </div>
  );
}