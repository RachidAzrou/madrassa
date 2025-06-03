import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  GraduationCap,
  ArrowRight,
  Plus,
  Settings,
  Award,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
// Tijdelijke PageHeader component voor herinschrijvingen

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
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showAcademicYearDialog, setShowAcademicYearDialog] = useState(false);
  const [bulkEnrollmentData, setBulkEnrollmentData] = useState<Partial<ReEnrollmentData>>({});

  // Data queries
  const { data: currentAcademicYear } = useQuery({
    queryKey: ['/api/academic-years/current'],
    select: (data: any) => data || null
  });

  const { data: studentsData = [] } = useQuery({ 
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
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Succes", description: "Bulk herinschrijving succesvol voltooid" });
      queryClient.invalidateQueries({ queryKey: ['/api/students/eligible-for-reenrollment'] });
      setShowBulkDialog(false);
      setSelectedStudents([]);
    }
  });

  const createAcademicYearMutation = useMutation({
    mutationFn: async (yearData: any) => {
      const response = await fetch('/api/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yearData)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Succes", description: "Schooljaar succesvol aangemaakt" });
      queryClient.invalidateQueries({ queryKey: ['/api/academic-years'] });
      setShowAcademicYearDialog(false);
    }
  });

  // Filter students
  const passedStudents = studentsData.filter((s: Student) => s.isPassed && s.promotionEligible);
  const failedStudents = studentsData.filter((s: Student) => !s.isPassed);
  const canStartRegistration = currentAcademicYear?.finalReportDate && 
    new Date() >= new Date(currentAcademicYear.finalReportDate);

  const handleSelectAll = (students: Student[]) => {
    const studentIds = students.map(s => s.id);
    if (selectedStudents.length === studentIds.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(studentIds);
    }
  };

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Herinschrijvingen</h1>
        <p className="text-muted-foreground">Beheer herinschrijvingen voor het nieuwe schooljaar</p>
      </div>

      {/* Registration Status Alert */}
      {!canStartRegistration && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Totaal Geschikt</p>
                <p className="text-2xl font-bold">{reEnrollmentStats.totalEligible}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Geslaagd</p>
                <p className="text-2xl font-bold">{reEnrollmentStats.passedStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gezakt</p>
                <p className="text-2xl font-bold">{reEnrollmentStats.failedStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Award className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ingeschreven</p>
                <p className="text-2xl font-bold">{reEnrollmentStats.enrolledStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Behandeling</p>
                <p className="text-2xl font-bold">{reEnrollmentStats.pendingEnrollments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button 
            onClick={handleBulkEnrollment}
            disabled={selectedStudents.length === 0 || !canStartRegistration}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <GraduationCap className="h-4 w-4 mr-2" />
            Bulk Herinschrijving ({selectedStudents.length})
          </Button>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAcademicYearDialog(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Schooljaar Beheer
          </Button>
        </div>
      </div>

      {/* Students Tables */}
      <Tabs defaultValue="passed" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="passed">
            Geslaagde Studenten ({passedStudents.length})
          </TabsTrigger>
          <TabsTrigger value="failed">
            Gezakte Studenten ({failedStudents.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="passed">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Geslaagde Studenten</CardTitle>
                  <CardDescription>
                    Studenten die geschikt zijn voor promotie naar het volgende jaar
                  </CardDescription>
                </div>
                <Checkbox
                  checked={selectedStudents.length === passedStudents.length && passedStudents.length > 0}
                  onCheckedChange={() => handleSelectAll(passedStudents)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Huidige Klas</TableHead>
                    <TableHead>Programma</TableHead>
                    <TableHead>Eindcijfer</TableHead>
                    <TableHead>Aanwezigheid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {passedStudents.map((student: Student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => handleStudentToggle(student.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                        <div className="text-sm text-gray-500">{student.studentId}</div>
                      </TableCell>
                      <TableCell>{student.currentClass}</TableCell>
                      <TableCell>{student.currentProgram}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-700">
                          {student.finalGrade?.toFixed(1) || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {student.attendancePercentage?.toFixed(0) || 'N/A'}%
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(student)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {passedStudents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Geen geslaagde studenten gevonden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed">
          <Card>
            <CardHeader>
              <CardTitle>Gezakte Studenten</CardTitle>
              <CardDescription>
                Studenten die het jaar moeten herhalen of speciale aandacht behoeven
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Huidige Klas</TableHead>
                    <TableHead>Programma</TableHead>
                    <TableHead>Eindcijfer</TableHead>
                    <TableHead>Aanwezigheid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedStudents.map((student: Student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                        <div className="text-sm text-gray-500">{student.studentId}</div>
                      </TableCell>
                      <TableCell>{student.currentClass}</TableCell>
                      <TableCell>{student.currentProgram}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-red-700">
                          {student.finalGrade?.toFixed(1) || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {student.attendancePercentage?.toFixed(0) || 'N/A'}%
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(student)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Handmatig Behandelen
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {failedStudents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Geen gezakte studenten gevonden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Enrollment Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Herinschrijving</DialogTitle>
            <DialogDescription>
              Configureer de herinschrijving voor {selectedStudents.length} geselecteerde studenten
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Doelklas</label>
              <Select onValueChange={(value) => setBulkEnrollmentData(prev => ({ ...prev, toClassId: parseInt(value) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer doelklas" />
                </SelectTrigger>
                <SelectContent>
                  {classesData.map((cls: Class) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name} - {cls.academicYear}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={bulkEnrollmentData.isPromotion ?? true}
                onCheckedChange={(checked) => setBulkEnrollmentData(prev => ({ ...prev, isPromotion: !!checked }))}
              />
              <label className="text-sm">Dit is een promotie naar hoger niveau</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={confirmBulkEnrollment}
              disabled={!bulkEnrollmentData.toClassId || bulkEnrollMutation.isPending}
            >
              {bulkEnrollMutation.isPending ? 'Bezig...' : 'Bevestigen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Academic Year Management Dialog */}
      <Dialog open={showAcademicYearDialog} onOpenChange={setShowAcademicYearDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schooljaar Beheer</DialogTitle>
            <DialogDescription>
              Beheer schooljaren, vakanties en herinschrijvingsperiodes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-muted-foreground py-8">
              Schooljaar beheer interface wordt binnenkort toegevoegd
            </p>
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