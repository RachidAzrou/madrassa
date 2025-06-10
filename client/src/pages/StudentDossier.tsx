import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  User, 
  FileText, 
  GraduationCap, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin,
  Users,
  BookOpen,
  ClipboardCheck,
  TrendingUp,
  Award,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';


interface Student {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  status: string;
  enrollmentDate?: string;
  className?: string;
  address?: string;
  photoUrl?: string;
}

interface Grade {
  id: number;
  courseName: string;
  grade: number;
  date: string;
  semester: string;
  credits: number;
}

interface Attendance {
  id: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  courseName: string;
}

export default function StudentDossier() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
    staleTime: 60000,
  });

  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ['/api/grades', selectedStudent?.id],
    enabled: !!selectedStudent,
    staleTime: 60000,
  });

  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ['/api/attendance', selectedStudent?.id],
    enabled: !!selectedStudent,
    staleTime: 60000,
  });

  const filteredStudents = students.filter(student =>
    student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateGPA = (grades: Grade[]) => {
    if (grades.length === 0) return 0;
    const total = grades.reduce((sum, grade) => sum + grade.grade, 0);
    return (total / grades.length).toFixed(1);
  };

  const getAttendanceRate = (attendance: Attendance[]) => {
    if (attendance.length === 0) return 100;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    return Math.round((presentCount / attendance.length) * 100);
  };

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Leerlingendossier</h1>
            <p className="text-sm text-gray-600">Bekijk uitgebreide dossiers van individuele studenten inclusief cijfers, aanwezigheid en persoonlijke informatie</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Student Zoeken */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Selecteer Student
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="search">Zoek Student</Label>
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Naam of student ID..."
                  className="mt-1"
                />
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Geen studenten gevonden</p>
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedStudent?.id === student.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedStudent(student)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.photoUrl} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{student.studentId}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Student Dossier */}
          <div className="lg:col-span-3">
            {selectedStudent ? (
              <div className="space-y-6">
                {/* Student Overzicht */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={selectedStudent.photoUrl} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                            {selectedStudent.firstName?.[0]}{selectedStudent.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="text-xl font-bold">
                            {selectedStudent.firstName} {selectedStudent.lastName}
                          </h2>
                          <p className="text-gray-600">{selectedStudent.studentId}</p>
                          <Badge variant={selectedStudent.status === 'enrolled' ? 'default' : 'secondary'}>
                            {selectedStudent.status === 'enrolled' ? 'Ingeschreven' : selectedStudent.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Klas</p>
                        <p className="font-medium">{selectedStudent.className || 'Geen klas'}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="text-sm">{selectedStudent.email || 'Niet beschikbaar'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Telefoon</p>
                          <p className="text-sm">{selectedStudent.phone || 'Niet beschikbaar'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Geboortedatum</p>
                          <p className="text-sm">{selectedStudent.dateOfBirth || 'Niet beschikbaar'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Statistieken */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Gemiddeld Cijfer</p>
                          <p className="text-2xl font-bold text-blue-600">{calculateGPA(grades)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Aanwezigheid</p>
                          <p className="text-2xl font-bold text-green-600">{getAttendanceRate(attendance)}%</p>
                        </div>
                        <ClipboardCheck className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Vakken</p>
                          <p className="text-2xl font-bold text-purple-600">{grades.length}</p>
                        </div>
                        <BookOpen className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedStudent.status === 'enrolled' ? 'Actief' : 'Inactief'}
                          </p>
                        </div>
                        <Award className="h-8 w-8 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Details Tabs */}
                <Tabs defaultValue="grades" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="grades">Cijfers</TabsTrigger>
                    <TabsTrigger value="attendance">Aanwezigheid</TabsTrigger>
                    <TabsTrigger value="personal">Persoonlijk</TabsTrigger>
                  </TabsList>

                  <TabsContent value="grades">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Cijfers Overzicht</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {grades.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p className="text-sm">Geen cijfers beschikbaar</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {grades.map((grade) => (
                              <div key={grade.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">{grade.courseName}</p>
                                  <p className="text-sm text-gray-500">{grade.semester} • {grade.credits} punten</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold">{grade.grade}</p>
                                  <p className="text-xs text-gray-500">{grade.date}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="attendance">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Aanwezigheid Historie</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {attendance.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
                            <p className="text-sm">Geen aanwezigheidsgegevens beschikbaar</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {attendance.slice(0, 10).map((record) => (
                              <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                  <p className="font-medium">{record.courseName}</p>
                                  <p className="text-sm text-gray-500">{record.date}</p>
                                </div>
                                <Badge 
                                  variant={
                                    record.status === 'present' ? 'default' :
                                    record.status === 'late' ? 'secondary' : 'destructive'
                                  }
                                >
                                  {record.status === 'present' ? 'Aanwezig' :
                                   record.status === 'late' ? 'Te laat' : 'Afwezig'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="personal">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Persoonlijke Informatie</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Volledige Naam</Label>
                            <Input value={`${selectedStudent.firstName} ${selectedStudent.lastName}`} readOnly />
                          </div>
                          <div>
                            <Label>Student ID</Label>
                            <Input value={selectedStudent.studentId} readOnly />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input value={selectedStudent.email || ''} readOnly />
                          </div>
                          <div>
                            <Label>Telefoon</Label>
                            <Input value={selectedStudent.phone || ''} readOnly />
                          </div>
                          <div>
                            <Label>Geboortedatum</Label>
                            <Input value={selectedStudent.dateOfBirth || ''} readOnly />
                          </div>
                          <div>
                            <Label>Inschrijvingsdatum</Label>
                            <Input value={selectedStudent.enrollmentDate || ''} readOnly />
                          </div>
                        </div>
                        
                        {selectedStudent.address && (
                          <div>
                            <Label>Adres</Label>
                            <Input value={selectedStudent.address} readOnly />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Selecteer een Student</h3>
                  <p className="text-gray-500">
                    Kies een student uit de lijst om het dossier te bekijken
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}