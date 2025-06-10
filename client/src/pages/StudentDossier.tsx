import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, Download, Filter, Eye, Edit, Trash2, 
  User, Users, GraduationCap, Phone, Mail, Calendar,
  MapPin, FileText, AlertTriangle, Star, BookOpen,
  Settings, Save, X, Upload, UserPlus, NotebookText,
  Home, MoreHorizontal, PlusCircle, ClipboardCheck,
  TrendingUp, Award, Clock
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
  status: string;
  courseName: string;
  notes?: string;
}

export default function StudentDossier() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDossier, setShowDossier] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const { toast } = useToast();

  // Fetch students data
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
    staleTime: 60000,
  });

  // Mock data for grades and attendance (would come from API)
  const grades: Grade[] = [];
  const attendance: Attendance[] = [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleViewDossier = (student: Student) => {
    setSelectedStudent(student);
    setShowDossier(true);
    setActiveTab('personal');
  };

  const filteredStudents = students.filter((student: Student) => {
    const matchesSearch = searchTerm === '' || 
      student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Calculate stats
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const graduatedStudents = students.filter(s => s.status === 'graduated').length;
  const averageGrade = grades.length > 0 ? 
    (grades.reduce((sum, grade) => sum + grade.grade, 0) / grades.length).toFixed(1) : '0.0';

  return (
    <div>
      <PremiumHeader 
        title="Leerlingendossier" 
        icon={FileText}
        description="Bekijk en beheer uitgebreide leerlingendossiers"
        breadcrumbs={{
          parent: "Evaluatie",
          current: "Leerlingendossier"
        }}
      />
      
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Totaal Leerlingen</p>
                  <p className="text-2xl font-bold">{totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Actieve Leerlingen</p>
                  <p className="text-2xl font-bold">{activeStudents}</p>
                </div>
                <User className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Afgestudeerden</p>
                  <p className="text-2xl font-bold">{graduatedStudents}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Gemiddeld Cijfer</p>
                  <p className="text-2xl font-bold">{averageGrade}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Zoek leerlingen op naam, student ID of email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leerlingen Overzicht</CardTitle>
            <CardDescription>
              Klik op een leerling om het volledige dossier te bekijken
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStudents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leerling</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Klas</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.photoUrl} />
                            <AvatarFallback>
                              {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.firstName} {student.lastName}</p>
                            <p className="text-sm text-gray-500">{student.gender}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>{student.className || '-'}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>
                        <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                          {student.status === 'active' ? 'Actief' : 
                           student.status === 'inactive' ? 'Inactief' : 
                           student.status === 'graduated' ? 'Afgestudeerd' : student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDossier(student)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Bekijk Dossier</p>
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
                icon={FileText}
                title="Geen leerlingen gevonden"
                description="Er zijn geen leerlingen die voldoen aan de zoekfilters."
              />
            )}
          </CardContent>
        </Card>

        {/* Dossier Dialog */}
        <Dialog open={showDossier} onOpenChange={setShowDossier}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Leerlingendossier - {selectedStudent?.firstName} {selectedStudent?.lastName}
              </DialogTitle>
              <DialogDescription>
                Uitgebreid overzicht van leerlinggegevens en prestaties
              </DialogDescription>
            </DialogHeader>

            {selectedStudent && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Persoonlijke Gegevens</TabsTrigger>
                  <TabsTrigger value="academic">Academisch</TabsTrigger>
                  <TabsTrigger value="attendance">Aanwezigheid</TabsTrigger>
                  <TabsTrigger value="notes">Notities</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Persoonlijke Informatie</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={selectedStudent.photoUrl} />
                            <AvatarFallback className="text-lg">
                              {selectedStudent.firstName?.charAt(0)}{selectedStudent.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-xl font-semibold">
                              {selectedStudent.firstName} {selectedStudent.lastName}
                            </h3>
                            <p className="text-gray-600">{selectedStudent.studentId}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Geslacht</Label>
                            <p className="text-sm text-gray-600">{selectedStudent.gender}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Klas</Label>
                            <p className="text-sm text-gray-600">{selectedStudent.className || '-'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                        <div>
                          <Label className="text-sm font-medium">Geboortedatum</Label>
                          <p className="text-sm text-gray-600">
                            {selectedStudent.dateOfBirth ? 
                              new Date(selectedStudent.dateOfBirth).toLocaleDateString('nl-NL') : '-'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Email</Label>
                          <p className="text-sm text-gray-600">{selectedStudent.email || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Telefoon</Label>
                          <p className="text-sm text-gray-600">{selectedStudent.phone || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Adres</Label>
                          <p className="text-sm text-gray-600">{selectedStudent.address || '-'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <Badge variant={selectedStudent.status === 'active' ? 'default' : 'secondary'}>
                            {selectedStudent.status === 'active' ? 'Actief' : 
                             selectedStudent.status === 'inactive' ? 'Inactief' : selectedStudent.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="academic" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Academische Prestaties</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {grades.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Vak</TableHead>
                              <TableHead>Cijfer</TableHead>
                              <TableHead>Semester</TableHead>
                              <TableHead>Credits</TableHead>
                              <TableHead>Datum</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {grades.map((grade) => (
                              <TableRow key={grade.id}>
                                <TableCell className="font-medium">{grade.courseName}</TableCell>
                                <TableCell>
                                  <Badge variant={grade.grade >= 6 ? 'default' : 'destructive'}>
                                    {grade.grade.toFixed(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell>{grade.semester}</TableCell>
                                <TableCell>{grade.credits}</TableCell>
                                <TableCell>
                                  {new Date(grade.date).toLocaleDateString('nl-NL')}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <EmptyState
                          icon={BookOpen}
                          title="Geen cijfers beschikbaar"
                          description="Er zijn nog geen cijfers geregistreerd voor deze leerling."
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="attendance" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Aanwezigheidsoverzicht</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {attendance.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Datum</TableHead>
                              <TableHead>Vak</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Opmerkingen</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendance.map((record) => (
                              <TableRow key={record.id}>
                                <TableCell>
                                  {new Date(record.date).toLocaleDateString('nl-NL')}
                                </TableCell>
                                <TableCell className="font-medium">{record.courseName}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      record.status === 'present' ? 'default' : 
                                      record.status === 'absent' ? 'destructive' : 'secondary'
                                    }
                                  >
                                    {record.status === 'present' ? 'Aanwezig' : 
                                     record.status === 'absent' ? 'Afwezig' : 
                                     record.status === 'late' ? 'Te laat' : record.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>{record.notes || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <EmptyState
                          icon={Calendar}
                          title="Geen aanwezigheidsgegevens"
                          description="Er zijn nog geen aanwezigheidsgegevens beschikbaar voor deze leerling."
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notities & Opmerkingen</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Voeg notities toe over deze leerling..."
                        className="min-h-[200px]"
                      />
                      <div className="flex justify-end mt-4">
                        <Button>
                          <Save className="h-4 w-4 mr-2" />
                          Opslaan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDossier(false)}>
                Sluiten
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}