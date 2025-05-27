import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  GraduationCap, 
  Calendar, 
  FileText, 
  CreditCard, 
  Users, 
  Phone, 
  Mail, 
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { PremiumHeader } from '@/components/layout/premium-header';

// Mock data voor demonstratie
const academicYears = [
  { id: '2024-2025', name: '2024-2025' },
  { id: '2023-2024', name: '2023-2024' },
  { id: '2022-2023', name: '2022-2023' }
];

const classes = {
  '2024-2025': [
    { id: 'arabisch-beginners', name: 'Arabisch Beginners', students: 15 },
    { id: 'quran-memorisatie', name: 'Quran Memorisatie', students: 12 },
    { id: 'islamitische-studies', name: 'Islamitische Studies', students: 18 }
  ],
  '2023-2024': [
    { id: 'arabisch-basis', name: 'Arabisch Basis', students: 14 },
    { id: 'quran-recitatie', name: 'Quran Recitatie', students: 10 }
  ]
};

const students = {
  'arabisch-beginners': [
    { 
      id: 'STU-001', 
      name: 'Ahmed Hassan', 
      email: 'ahmed.hassan@email.com',
      phone: '06-12345678',
      dateOfBirth: '2010-03-15',
      address: 'Lange Voorhout 10, 2514 ED Den Haag',
      enrollmentDate: '2024-09-01',
      status: 'Actief'
    },
    { 
      id: 'STU-004', 
      name: 'Yusuf Ibrahim', 
      email: 'yusuf.ibrahim@email.com',
      phone: '06-87654321',
      dateOfBirth: '2011-07-22',
      address: 'Prinsengracht 123, 1015 DX Amsterdam',
      enrollmentDate: '2024-09-01',
      status: 'Actief'
    }
  ],
  'quran-memorisatie': [
    { 
      id: 'STU-002', 
      name: 'Fatima Al-Zahra', 
      email: 'fatima.zahra@email.com',
      phone: '06-11223344',
      dateOfBirth: '2009-11-08',
      address: 'Kalverstraat 92, 1012 PH Amsterdam',
      enrollmentDate: '2024-09-01',
      status: 'Actief'
    }
  ]
};

const mockStudentData = {
  'STU-001': {
    personal: {
      id: 'STU-001',
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@email.com',
      phone: '06-12345678',
      dateOfBirth: '2010-03-15',
      address: 'Lange Voorhout 10, 2514 ED Den Haag',
      enrollmentDate: '2024-09-01',
      status: 'Actief',
      avatar: null
    },
    guardians: [
      {
        id: 'GUA-001',
        name: 'Omar Hassan',
        relationship: 'Vader',
        email: 'omar.hassan@email.com',
        phone: '06-98765432',
        address: 'Lange Voorhout 10, 2514 ED Den Haag',
        occupation: 'Software Engineer',
        emergencyContact: true
      },
      {
        id: 'GUA-002',
        name: 'Zahra Hassan',
        relationship: 'Moeder',
        email: 'zahra.hassan@email.com',
        phone: '06-11111111',
        address: 'Lange Voorhout 10, 2514 ED Den Haag',
        occupation: 'Lerares',
        emergencyContact: false
      }
    ],
    siblings: [
      {
        id: 'STU-007',
        name: 'Amina Hassan',
        class: 'Islamitische Studies',
        year: '2024-2025',
        status: 'Actief'
      }
    ],
    grades: [
      {
        subject: 'Arabisch',
        period: 'Periode 1',
        grade: 8.5,
        date: '2024-10-15',
        teacher: 'Ustadh Abdullah',
        notes: 'Uitstekende vooruitgang in grammatica'
      },
      {
        subject: 'Quran Recitatie',
        period: 'Periode 1',
        grade: 9.0,
        date: '2024-10-20',
        teacher: 'Ustadha Khadija',
        notes: 'Zeer goede uitspraak en memorisatie'
      },
      {
        subject: 'Islamitische Studies',
        period: 'Periode 1',
        grade: 7.8,
        date: '2024-10-25',
        teacher: 'Ustadh Muhammad',
        notes: 'Goed begrip van de leerstof'
      }
    ],
    attendance: [
      { date: '2024-12-16', status: 'Aanwezig', subject: 'Arabisch' },
      { date: '2024-12-15', status: 'Aanwezig', subject: 'Quran Recitatie' },
      { date: '2024-12-14', status: 'Afwezig', subject: 'Islamitische Studies', reason: 'Ziek' },
      { date: '2024-12-13', status: 'Aanwezig', subject: 'Arabisch' },
      { date: '2024-12-12', status: 'Te laat', subject: 'Quran Recitatie', reason: '15 minuten' }
    ],
    payments: [
      {
        id: 'PAY-001',
        type: 'Inschrijvingsgeld',
        amount: 150.00,
        status: 'Betaald',
        date: '2024-08-15',
        dueDate: '2024-09-01',
        reference: 'INS001'
      },
      {
        id: 'PAY-002',
        type: 'Lesmateriaal',
        amount: 45.00,
        status: 'Openstaand',
        date: null,
        dueDate: '2024-12-31',
        reference: 'LES001'
      }
    ],
    reports: [
      {
        id: 'REP-001',
        title: 'Tussenrapport Periode 1',
        date: '2024-11-15',
        type: 'Tussenrapport',
        status: 'Definitief'
      },
      {
        id: 'REP-002',
        title: 'Voortgangsrapport',
        date: '2024-10-30',
        type: 'Voortgang',
        status: 'Concept'
      }
    ]
  }
};

export default function StudentDossier() {
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [studentData, setStudentData] = useState<any>(null);

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId);
    // In echte implementatie zou hier een API call komen
    setStudentData(mockStudentData[studentId as keyof typeof mockStudentData] || null);
  };

  const getAttendanceStats = () => {
    if (!studentData?.attendance) return { aanwezig: 0, afwezig: 0, teLaat: 0, percentage: 0 };
    
    const aanwezig = studentData.attendance.filter((a: any) => a.status === 'Aanwezig').length;
    const afwezig = studentData.attendance.filter((a: any) => a.status === 'Afwezig').length;
    const teLaat = studentData.attendance.filter((a: any) => a.status === 'Te laat').length;
    const total = studentData.attendance.length;
    const percentage = total > 0 ? Math.round((aanwezig / total) * 100) : 0;
    
    return { aanwezig, afwezig, teLaat, percentage };
  };

  const getGradeAverage = () => {
    if (!studentData?.grades || studentData.grades.length === 0) return 0;
    const sum = studentData.grades.reduce((acc: number, grade: any) => acc + grade.grade, 0);
    return (sum / studentData.grades.length).toFixed(1);
  };

  const availableClasses = selectedYear ? classes[selectedYear as keyof typeof classes] || [] : [];
  const availableStudents = selectedClass ? students[selectedClass as keyof typeof students] || [] : [];
  const filteredStudents = availableStudents.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const attendanceStats = getAttendanceStats();
  const gradeAverage = getGradeAverage();

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      <PremiumHeader 
        title="Leerlingendossier"
        description="Bekijk uitgebreide leerlinggegevens en voortgang"
        icon={<User className="h-6 w-6" />}
        breadcrumb={{
          items: [
            { label: "Dashboard", href: "/" },
            { label: "Leerlingendossier" }
          ]
        }}
      />

      <div className="container mx-auto px-6 py-8">
        {!studentData ? (
          // Student selectie interface
          <div className="max-w-4xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Student Selecteren
                </CardTitle>
                <CardDescription>
                  Zoek een student om het volledige dossier te bekijken
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Schooljaar selectie */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Schooljaar</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer schooljaar" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map(year => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="class">Klas</Label>
                    <Select 
                      value={selectedClass} 
                      onValueChange={setSelectedClass}
                      disabled={!selectedYear}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer klas" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableClasses.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} ({cls.students} studenten)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="search">Zoek student</Label>
                    <Input
                      placeholder="Naam of student-ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={!selectedClass}
                    />
                  </div>
                </div>

                {/* Studenten lijst */}
                {selectedClass && (
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-3">
                        Studenten in {availableClasses.find(c => c.id === selectedClass)?.name}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredStudents.map(student => (
                          <Card 
                            key={student.id} 
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleStudentSelect(student.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarFallback>
                                    {student.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{student.name}</div>
                                  <div className="text-sm text-gray-500">{student.id}</div>
                                  <Badge variant="outline" className="mt-1">
                                    {student.status}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      {filteredStudents.length === 0 && selectedClass && (
                        <div className="text-center py-8 text-gray-500">
                          Geen studenten gevonden
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Student dossier weergave
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Student header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg">
                        {studentData.personal.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h1 className="text-2xl font-bold">{studentData.personal.name}</h1>
                      <p className="text-gray-600">{studentData.personal.id}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant={studentData.personal.status === 'Actief' ? 'default' : 'secondary'}>
                          {studentData.personal.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Ingeschreven: {new Date(studentData.personal.enrollmentDate).toLocaleDateString('nl-NL')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setStudentData(null);
                      setSelectedStudent('');
                    }}
                  >
                    Andere student
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Gemiddeld cijfer</p>
                      <p className="text-2xl font-bold text-green-600">{gradeAverage}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Aanwezigheid</p>
                      <p className="text-2xl font-bold text-blue-600">{attendanceStats.percentage}%</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Openstaande betalingen</p>
                      <p className="text-2xl font-bold text-orange-600">
                        €{studentData.payments.filter((p: any) => p.status === 'Openstaand').reduce((acc: number, p: any) => acc + p.amount, 0).toFixed(2)}
                      </p>
                    </div>
                    <CreditCard className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Rapporten</p>
                      <p className="text-2xl font-bold text-purple-600">{studentData.reports.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview">Overzicht</TabsTrigger>
                <TabsTrigger value="grades">Cijfers</TabsTrigger>
                <TabsTrigger value="attendance">Aanwezigheid</TabsTrigger>
                <TabsTrigger value="payments">Betalingen</TabsTrigger>
                <TabsTrigger value="family">Familie</TabsTrigger>
                <TabsTrigger value="reports">Rapporten</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Persoonlijke gegevens
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Geboortedatum</Label>
                          <p>{new Date(studentData.personal.dateOfBirth).toLocaleDateString('nl-NL')}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Leeftijd</Label>
                          <p>{new Date().getFullYear() - new Date(studentData.personal.dateOfBirth).getFullYear()} jaar</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">E-mail</Label>
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {studentData.personal.email}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Telefoon</Label>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {studentData.personal.phone}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Adres</Label>
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {studentData.personal.address}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Recente activiteit
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Aanwezig bij Arabisch</span>
                          </div>
                          <span className="text-xs text-gray-500">Vandaag</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">Cijfer 9.0 voor Quran Recitatie</span>
                          </div>
                          <span className="text-xs text-gray-500">Gisteren</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <span className="text-sm">Openstaande betaling lesmateriaal</span>
                          </div>
                          <span className="text-xs text-gray-500">3 dagen geleden</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="grades" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Cijfers overzicht</CardTitle>
                    <CardDescription>Alle behaalde resultaten en voortgang</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studentData.grades.map((grade: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">{grade.subject}</div>
                            <div className="text-sm text-gray-600">{grade.period} • {grade.teacher}</div>
                            {grade.notes && (
                              <div className="text-sm text-gray-500 mt-1">{grade.notes}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              grade.grade >= 8 ? 'text-green-600' : 
                              grade.grade >= 6.5 ? 'text-blue-600' : 
                              'text-orange-600'
                            }`}>
                              {grade.grade}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(grade.date).toLocaleDateString('nl-NL')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attendance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Aanwezigheidsoverzicht</CardTitle>
                    <CardDescription>
                      {attendanceStats.aanwezig} aanwezig, {attendanceStats.afwezig} afwezig, {attendanceStats.teLaat} te laat
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {studentData.attendance.map((record: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {record.status === 'Aanwezig' && <CheckCircle className="h-5 w-5 text-green-600" />}
                            {record.status === 'Afwezig' && <XCircle className="h-5 w-5 text-red-600" />}
                            {record.status === 'Te laat' && <Clock className="h-5 w-5 text-orange-600" />}
                            <div>
                              <div className="font-medium">{record.subject}</div>
                              <div className="text-sm text-gray-600">
                                {new Date(record.date).toLocaleDateString('nl-NL')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              record.status === 'Aanwezig' ? 'default' :
                              record.status === 'Afwezig' ? 'destructive' :
                              'secondary'
                            }>
                              {record.status}
                            </Badge>
                            {record.reason && (
                              <div className="text-sm text-gray-500 mt-1">{record.reason}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Betalingsoverzicht</CardTitle>
                    <CardDescription>Alle betalingen en openstaande bedragen</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {studentData.payments.map((payment: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">{payment.type}</div>
                            <div className="text-sm text-gray-600">
                              Referentie: {payment.reference}
                            </div>
                            <div className="text-sm text-gray-500">
                              Vervaldatum: {new Date(payment.dueDate).toLocaleDateString('nl-NL')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">€{payment.amount.toFixed(2)}</div>
                            <Badge variant={payment.status === 'Betaald' ? 'default' : 'destructive'}>
                              {payment.status}
                            </Badge>
                            {payment.date && (
                              <div className="text-sm text-gray-500 mt-1">
                                Betaald: {new Date(payment.date).toLocaleDateString('nl-NL')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="family" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Voogden
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {studentData.guardians.map((guardian: any, index: number) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium">{guardian.name}</div>
                                <div className="text-sm text-gray-600">{guardian.relationship}</div>
                                <div className="text-sm text-gray-500 mt-1">{guardian.occupation}</div>
                              </div>
                              {guardian.emergencyContact && (
                                <Badge variant="outline">Noodcontact</Badge>
                              )}
                            </div>
                            <div className="mt-3 space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4" />
                                {guardian.email}
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4" />
                                {guardian.phone}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Broers/Zussen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {studentData.siblings.map((sibling: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="font-medium">{sibling.name}</div>
                            <div className="text-sm text-gray-600">{sibling.class} • {sibling.year}</div>
                            <Badge variant="outline" className="mt-2">
                              {sibling.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Rapporten en documenten</CardTitle>
                    <CardDescription>Alle gegenereerde rapporten en documenten</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {studentData.reports.map((report: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div>
                              <div className="font-medium">{report.title}</div>
                              <div className="text-sm text-gray-600">{report.type}</div>
                              <div className="text-sm text-gray-500">
                                {new Date(report.date).toLocaleDateString('nl-NL')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={report.status === 'Definitief' ? 'default' : 'secondary'}>
                              {report.status}
                            </Badge>
                            <Button variant="outline" size="sm">
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}