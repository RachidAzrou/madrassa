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
  BookOpen,
  Shield
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
  const filteredClasses = selectedAcademicYear && selectedAcademicYear !== 'all'
    ? classes.filter(c => c.academicYear === selectedAcademicYear)
    : classes;

  // Filter students by class or search term
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Only show students that have actual data
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

  // Echte data van API's - alleen ophalen als student geselecteerd is
  const { data: studentGuardians = [] } = useQuery({ 
    queryKey: [`/api/students/${selectedStudent?.id}/guardians`],
    enabled: !!selectedStudent
  });

  const { data: studentSiblings = [] } = useQuery({ 
    queryKey: [`/api/students/${selectedStudent?.id}/siblings`],
    enabled: !!selectedStudent
  });

  // Vind het programma waar de student bij hoort
  const studentProgram = selectedStudent ? subjects.find((program: any) => 
    program.id === selectedStudent.programId
  ) : null;

  // Vind de klas waar de student bij hoort
  const studentClass = selectedStudent ? classes.find((cls: any) => 
    cls.students?.some((s: any) => s.id === selectedStudent.id)
  ) : null;

  // Bereken geboorteleeftijd
  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

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
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedStudent.photoUrl || undefined} />
                    <AvatarFallback className="text-lg">{getStudentInitials(selectedStudent)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{selectedStudent.firstName} {selectedStudent.lastName}</h1>
                    <p className="text-gray-600">Student ID: {selectedStudent.studentId}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(selectedStudent.status)}
                      {selectedStudent.academicYear && (
                        <Badge variant="outline">{selectedStudent.academicYear}</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button onClick={() => setSelectedStudent(null)} variant="outline" size="sm">
                  ← Terug naar overzicht
                </Button>
              </div>
            </div>

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
                        <label className="text-sm font-medium text-gray-600">Inschrijfdatum</label>
                        <p className="font-medium">{selectedStudent.enrollmentDate ? formatDate(selectedStudent.enrollmentDate) : 'Niet opgegeven'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Academisch jaar</label>
                        <p className="font-medium">{selectedStudent.academicYear || 'Niet opgegeven'}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Programma</label>
                        <p className="font-medium">{studentProgram?.name || 'Niet toegewezen'}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-600">Klas</label>
                        <p className="font-medium">{studentClass?.name || 'Niet toegewezen'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <div className="mt-1">
                          {getStatusBadge(selectedStudent.status)}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {selectedStudent.emergencyContact && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                            <Shield className="h-4 w-4" />
                            Noodcontact
                          </label>
                          <p className="font-medium">{selectedStudent.emergencyContact}</p>
                          {selectedStudent.emergencyPhone && (
                            <p className="text-sm text-gray-600">{selectedStudent.emergencyPhone}</p>
                          )}
                        </div>
                      )}
                      
                      {selectedStudent.medicalInfo && (
                        <div>
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            Medische informatie
                          </label>
                          <p className="font-medium">{selectedStudent.medicalInfo}</p>
                        </div>
                      )}
                      
                      {selectedStudent.notes && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Algemene notities</label>
                          <p className="font-medium">{selectedStudent.notes}</p>
                        </div>
                      )}
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
                    {(studentGuardians as any[]).length > 0 ? (
                      <div className="space-y-4">
                        {(studentGuardians as any[]).map((guardian: any) => (
                          <div key={guardian.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2">
                                <h4 className="font-semibold">{guardian.firstName} {guardian.lastName}</h4>
                                <p className="text-sm text-gray-600">{guardian.relationship || 'Niet opgegeven'}</p>
                                <div className="space-y-1 text-sm">
                                  <p className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {guardian.email || 'Niet opgegeven'}
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
                        
                        {(studentSiblings as any[]).length > 0 && (
                          <div className="mt-6">
                            <h4 className="font-semibold mb-3">Broers & Zussen</h4>
                            <div className="space-y-2">
                              {(studentSiblings as any[]).map((sibling: any) => (
                                <div key={sibling.id} className="p-3 bg-gray-50 rounded-lg">
                                  <p className="font-medium">{sibling.firstName} {sibling.lastName}</p>
                                  <p className="text-sm text-gray-600">Student ID: {sibling.studentId}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Geen voogd informatie beschikbaar</p>
                    )}
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
                    {/* Geen cijfers data beschikbaar in huidige systeem */}
                    {false ? (
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
                          {/* Placeholder voor als cijfers data beschikbaar zou zijn */}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Geen cijfers beschikbaar</p>
                    )}
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
                    {/* Geen aanwezigheidsdata beschikbaar in huidige systeem */}
                    {false ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Datum</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Notities</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Placeholder voor als aanwezigheidsdata beschikbaar zou zijn */}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Geen aanwezigheidsgegevens beschikbaar</p>
                    )}
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
                    {/* Geen betalingsdata beschikbaar in huidige systeem */}
                    {false ? (
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
                          {/* Placeholder voor als betalingsdata beschikbaar zou zijn */}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Geen betalingsgegevens beschikbaar</p>
                    )}
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
                      {selectedStudent?.notes ? (
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-blue-900">Algemene notities</h4>
                          <p className="text-blue-800 text-sm mt-1">{selectedStudent.notes}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-8">Geen notities beschikbaar</p>
                      )}
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