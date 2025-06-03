import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  FileText, 
  User, 
  Users, 
  GraduationCap, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Calculator, 
  CreditCard,
  Clock,
  MessageSquare,
  Search,
  Eye,
  UserPlus,
  Heart,
  Home,
  BookOpen
} from 'lucide-react';
import { PremiumHeader } from '@/components/layout/premium-header';
import { 
  DataTableContainer, 
  SearchActionBar, 
  TableContainer,
  DataTableHeader,
  TableLoadingState,
  EmptyTableState,
  QuickActions
} from "@/components/ui/data-table-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  street: string | null;
  houseNumber: string | null;
  postalCode: string | null;
  city: string | null;
  programId: number | null;
  academicYear: string | null;
  enrollmentDate: string | null;
  status: string;
  photoUrl: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  medicalInfo: string | null;
  notes: string | null;
}

interface Guardian {
  id: number;
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  phone: string | null;
  address: string | null;
  isEmergencyContact: boolean;
}

interface StudentGroup {
  id: number;
  name: string;
  academicYear: string;
  programId: number;
}

interface Grade {
  id: number;
  studentId: number;
  programId: number;
  gradeType: string;
  score: number;
  maxScore: number;
  weight: number;
  date: string;
  notes: string | null;
  programName?: string;
}

interface AttendanceRecord {
  id: number;
  studentId: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes: string | null;
}

interface Payment {
  id: number;
  studentId: number;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  dueDate: string;
  paidDate: string | null;
  description: string;
}

export default function StudentDossier() {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: classesData = [] } = useQuery({ 
    queryKey: ['/api/student-groups']
  });
  const { data: studentsData = [] } = useQuery({ 
    queryKey: ['/api/students']
  });
  const { data: programsData = { programs: [] } } = useQuery({ 
    queryKey: ['/api/programs']
  });

  const classes = classesData as StudentGroup[];
  const students = studentsData as Student[];
  const subjects = (programsData as any)?.programs || [];

  // Academic years from classes
  const uniqueYears = new Set<string>();
  classes.forEach(c => uniqueYears.add(c.academicYear));
  const academicYears = Array.from(uniqueYears);

  // Filter classes by academic year
  const filteredClasses = selectedAcademicYear 
    ? classes.filter(c => c.academicYear === selectedAcademicYear)
    : classes;

  // Filter students by class or search term
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedClass) {
      // Filter by selected class (would need enrollment data in real app)
      return matchesSearch;
    }
    
    return matchesSearch;
  });

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setActiveTab('overview');
  };

  const getStudentInitials = (student: Student) => {
    return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Niet opgegeven';
    return new Date(dateString).toLocaleDateString('nl-NL');
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'active': { label: 'Actief', variant: 'default' as const },
      'inactive': { label: 'Inactief', variant: 'secondary' as const },
      'graduated': { label: 'Afgestudeerd', variant: 'outline' as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // Mock data voor demonstratie - in echte app zou dit van API komen
  const mockGrades: Grade[] = selectedStudent ? [
    { id: 1, studentId: selectedStudent.id, programId: 36, gradeType: 'test', score: 8.5, maxScore: 10, weight: 0.3, date: '2025-01-15', notes: null, programName: 'Koran' },
    { id: 2, studentId: selectedStudent.id, programId: 36, gradeType: 'homework', score: 7.8, maxScore: 10, weight: 0.2, date: '2025-01-20', notes: null, programName: 'Koran' },
    { id: 3, studentId: selectedStudent.id, programId: 37, gradeType: 'test', score: 9.0, maxScore: 10, weight: 0.3, date: '2025-01-18', notes: null, programName: 'Arabisch' },
  ] : [];

  const mockAttendance: AttendanceRecord[] = selectedStudent ? [
    { id: 1, studentId: selectedStudent.id, date: '2025-06-01', status: 'present', notes: null },
    { id: 2, studentId: selectedStudent.id, date: '2025-06-02', status: 'present', notes: null },
    { id: 3, studentId: selectedStudent.id, date: '2025-06-03', status: 'late', notes: 'Verkeer' },
  ] : [];

  const mockPayments: Payment[] = selectedStudent ? [
    { id: 1, studentId: selectedStudent.id, amount: 250.00, status: 'paid', dueDate: '2025-01-01', paidDate: '2024-12-28', description: 'Schoolgeld Q1 2025' },
    { id: 2, studentId: selectedStudent.id, amount: 250.00, status: 'pending', dueDate: '2025-04-01', paidDate: null, description: 'Schoolgeld Q2 2025' },
  ] : [];

  const mockGuardians: Guardian[] = selectedStudent ? [
    { id: 1, firstName: 'Ahmed', lastName: 'El Mouden', relationship: 'Vader', email: 'ahmed@email.com', phone: '0496123456', address: 'Schoolstraat 123, 2000 Antwerpen', isEmergencyContact: true },
    { id: 2, firstName: 'Fatima', lastName: 'El Mouden', relationship: 'Moeder', email: 'fatima@email.com', phone: '0496789012', address: 'Schoolstraat 123, 2000 Antwerpen', isEmergencyContact: false },
  ] : [];

  return (
    <DataTableContainer>
      <PremiumHeader 
        title="Leerlingendossier" 
        icon={FileText}
        description="Bekijk complete studentinformatie en historiek"
      />

      <div className="space-y-6">
        {!selectedStudent ? (
          // Student selectie
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Student selecteren
                </CardTitle>
                <CardDescription>
                  Kies een schooljaar en klas, of zoek direct op naam of student ID
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Schooljaar</label>
                    <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer schooljaar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle schooljaren</SelectItem>
                        {academicYears.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Klas</label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer klas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle klassen</SelectItem>
                        {filteredClasses.map(cls => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.name} - {cls.academicYear}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Zoek student</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Naam of student ID"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Student lijst */}
                <div className="space-y-4">
                  <h4 className="font-medium">Studenten ({filteredStudents.length})</h4>
                  <div className="grid gap-3 max-h-96 overflow-y-auto">
                    {filteredStudents.map(student => (
                      <div 
                        key={student.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleStudentSelect(student)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={student.photoUrl || undefined} />
                            <AvatarFallback>{getStudentInitials(student)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h5 className="font-medium">{student.firstName} {student.lastName}</h5>
                            <p className="text-sm text-gray-600">ID: {student.studentId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(student.status)}
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Bekijk
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Student dossier
          <div className="space-y-6">
            {/* Student header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedStudent.photoUrl || undefined} />
                      <AvatarFallback className="text-lg">{getStudentInitials(selectedStudent)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                      <p className="text-gray-600">Student ID: {selectedStudent.studentId}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(selectedStudent.status)}
                        <Badge variant="outline">{selectedStudent.academicYear}</Badge>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => setSelectedStudent(null)} variant="outline">
                    Andere student kiezen
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Overzicht
                </TabsTrigger>
                <TabsTrigger value="guardians" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Voogden
                </TabsTrigger>
                <TabsTrigger value="grades" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Cijfers
                </TabsTrigger>
                <TabsTrigger value="attendance" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Aanwezigheid
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Betalingen
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notities
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Persoonlijke informatie */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Persoonlijke informatie
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Voornaam</label>
                          <p className="font-medium">{selectedStudent.firstName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Achternaam</label>
                          <p className="font-medium">{selectedStudent.lastName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Geboortedatum</label>
                          <p className="font-medium">{formatDate(selectedStudent.dateOfBirth)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Geslacht</label>
                          <p className="font-medium">{selectedStudent.gender || 'Niet opgegeven'}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          E-mail
                        </label>
                        <p className="font-medium">{selectedStudent.email || 'Niet opgegeven'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          Telefoon
                        </label>
                        <p className="font-medium">{selectedStudent.phone || 'Niet opgegeven'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Adres
                        </label>
                        <p className="font-medium">
                          {selectedStudent.street && selectedStudent.houseNumber 
                            ? `${selectedStudent.street} ${selectedStudent.houseNumber}`
                            : selectedStudent.address || 'Niet opgegeven'
                          }
                        </p>
                        {selectedStudent.postalCode && selectedStudent.city && (
                          <p className="text-sm text-gray-600">
                            {selectedStudent.postalCode} {selectedStudent.city}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Inschrijving informatie */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Inschrijving
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Eerste inschrijving</label>
                        <p className="font-medium">{formatDate(selectedStudent.enrollmentDate)}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Academisch jaar</label>
                        <p className="font-medium">{selectedStudent.academicYear || 'Niet opgegeven'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <div className="mt-1">
                          {getStatusBadge(selectedStudent.status)}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          Medische informatie
                        </label>
                        <p className="font-medium">{selectedStudent.medicalInfo || 'Geen bijzonderheden'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Notities</label>
                        <p className="font-medium">{selectedStudent.notes || 'Geen notities'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="guardians">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Voogden & Familie
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockGuardians.map(guardian => (
                        <div key={guardian.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <h4 className="font-semibold">{guardian.firstName} {guardian.lastName}</h4>
                              <p className="text-sm text-gray-600">{guardian.relationship}</p>
                              <div className="space-y-1 text-sm">
                                <p className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  {guardian.email}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  {guardian.phone || 'Niet opgegeven'}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Home className="h-4 w-4" />
                                  {guardian.address || 'Niet opgegeven'}
                                </p>
                              </div>
                            </div>
                            {guardian.isEmergencyContact && (
                              <Badge variant="destructive">Noodcontact</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="grades">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Cijfers overzicht
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vak</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Cijfer</TableHead>
                          <TableHead>Max</TableHead>
                          <TableHead>Datum</TableHead>
                          <TableHead>Notities</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockGrades.map(grade => (
                          <TableRow key={grade.id}>
                            <TableCell className="font-medium">{grade.programName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{grade.gradeType}</Badge>
                            </TableCell>
                            <TableCell className="font-bold">{grade.score}</TableCell>
                            <TableCell>{grade.maxScore}</TableCell>
                            <TableCell>{formatDate(grade.date)}</TableCell>
                            <TableCell>{grade.notes || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attendance">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Aanwezigheid
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Datum</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notities</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockAttendance.map(attendance => (
                          <TableRow key={attendance.id}>
                            <TableCell>{formatDate(attendance.date)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  attendance.status === 'present' ? 'default' :
                                  attendance.status === 'late' ? 'secondary' : 'destructive'
                                }
                              >
                                {attendance.status === 'present' ? 'Aanwezig' :
                                 attendance.status === 'late' ? 'Te laat' : 'Afwezig'}
                              </Badge>
                            </TableCell>
                            <TableCell>{attendance.notes || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Betalingen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Beschrijving</TableHead>
                          <TableHead>Bedrag</TableHead>
                          <TableHead>Vervaldatum</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Betaaldatum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockPayments.map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.description}</TableCell>
                            <TableCell>€{payment.amount.toFixed(2)}</TableCell>
                            <TableCell>{formatDate(payment.dueDate)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  payment.status === 'paid' ? 'default' :
                                  payment.status === 'pending' ? 'secondary' : 'destructive'
                                }
                              >
                                {payment.status === 'paid' ? 'Betaald' :
                                 payment.status === 'pending' ? 'Wachtend' : 'Achterstallig'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(payment.paidDate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Notities & Opmerkingen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900">Gedragsnotities</h4>
                        <p className="text-blue-800 text-sm mt-1">Goede student, werkt goed samen met klasgenoten. Toont respect voor docenten.</p>
                        <p className="text-xs text-blue-600 mt-2">Toegevoegd: 15 januari 2025</p>
                      </div>
                      
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-semibold text-yellow-900">Aanwezigheidsnotities</h4>
                        <p className="text-yellow-800 text-sm mt-1">Af en toe te laat door openbaar vervoer. Ouders zijn op de hoogte.</p>
                        <p className="text-xs text-yellow-600 mt-2">Toegevoegd: 20 januari 2025</p>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-900">Algemene notities</h4>
                        <p className="text-green-800 text-sm mt-1">Zeer gemotiveerde student. Interesse in extra Arabische lessen.</p>
                        <p className="text-xs text-green-600 mt-2">Toegevoegd: 25 januari 2025</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </DataTableContainer>
  );
}