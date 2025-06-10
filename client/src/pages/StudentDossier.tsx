import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, Plus, Download, Filter, Eye, Edit, Trash2, 
  User, Users, GraduationCap, Phone, Mail, Calendar,
  MapPin, FileText, AlertTriangle, Star, BookOpen,
  Settings, Save, X, Upload, UserPlus, NotebookText,
  Home, MoreHorizontal, PlusCircle, ClipboardCheck,
  TrendingUp, Award, Clock
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

const QuickActions = ({ onView, onEdit, onDelete }: { onView: () => void, onEdit: () => void, onDelete: () => void }) => (
  <div className="flex items-center gap-1">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onView}>
            <Eye className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bekijken</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onEdit}>
            <Edit className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bewerken</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Verwijderen</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

export default function StudentDossier() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDossier, setShowDossier] = useState(false);

  // Fetch students data
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students']
  });

  // Fetch grades for selected student
  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ['/api/students', selectedStudent?.id, 'grades'],
    enabled: !!selectedStudent
  });

  // Fetch attendance for selected student
  const { data: attendance = [] } = useQuery<Attendance[]>({
    queryKey: ['/api/students', selectedStudent?.id, 'attendance'],
    enabled: !!selectedStudent
  });

  const handleViewDossier = (student: Student) => {
    setSelectedStudent(student);
    setShowDossier(true);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;
    const matchesClass = selectedClass === 'all' || student.className === selectedClass;
    
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Leerlingendossier</h1>
        <p className="text-gray-600">Bekijk en beheer uitgebreide leerlingendossiers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Leerlingen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actieve Leerlingen</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uitgeschreven</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.filter(s => s.status === 'inactive').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gemiddelde Cijfer</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7.8</div>
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
                placeholder="Zoeken op naam, leerlingnummer of email..."
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
                <SelectItem value="active">Actief</SelectItem>
                <SelectItem value="inactive">Inactief</SelectItem>
                <SelectItem value="graduated">Afgestudeerd</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="Klas" />
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
                  <Checkbox />
                </TableHead>
                <TableHead>Leerling</TableHead>
                <TableHead>Leerlingnummer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Klas</TableHead>
                <TableHead>Contactgegevens</TableHead>
                <TableHead>Voogd</TableHead>
                <TableHead>Laatste Update</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id} className="border-b border-[#f3f4f6] hover:bg-gray-50/50">
                  <TableCell>
                    <Checkbox />
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
                    <Badge 
                      variant={student.status === 'active' ? 'default' : 
                               student.status === 'inactive' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {student.status === 'active' ? 'Actief' : 
                       student.status === 'inactive' ? 'Inactief' : 
                       student.status === 'graduated' ? 'Afgestudeerd' : student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{student.className || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone className="h-3 w-3" />
                        {student.phone || '-'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{student.guardianName || '-'}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">
                      {new Date(student.createdAt).toLocaleDateString('nl-NL')}
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
                              onClick={() => handleViewDossier(student)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Dossier bekijken</TooltipContent>
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
              icon={<FileText className="h-12 w-12" />}
              title="Geen leerlingen gevonden"
              description="Er zijn geen leerlingen die voldoen aan de zoekfilters."
            />
          </div>
        )}
      </DataTableContainer>

      {/* Student Dossier Dialog */}
      <Dialog open={showDossier} onOpenChange={setShowDossier}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedStudent?.photoUrl} />
                <AvatarFallback>
                  {selectedStudent?.firstName.charAt(0)}{selectedStudent?.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div>{selectedStudent?.firstName} {selectedStudent?.lastName}</div>
                <div className="text-sm text-gray-500 font-normal">
                  Leerlingnummer: {selectedStudent?.studentId}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Persoonlijk</TabsTrigger>
                <TabsTrigger value="academic">Academisch</TabsTrigger>
                <TabsTrigger value="attendance">Aanwezigheid</TabsTrigger>
                <TabsTrigger value="notes">Notities</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Persoonlijke Informatie</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Volledige Naam</Label>
                        <p className="text-sm text-gray-600">
                          {selectedStudent.firstName} {selectedStudent.lastName}
                        </p>
                      </div>
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
                            <TableHead>Datum</TableHead>
                            <TableHead>Semester</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {grades.map((grade) => (
                            <TableRow key={grade.id}>
                              <TableCell>{grade.courseName}</TableCell>
                              <TableCell>
                                <Badge variant={grade.grade >= 6 ? 'default' : 'destructive'}>
                                  {grade.grade}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(grade.date).toLocaleDateString('nl-NL')}
                              </TableCell>
                              <TableCell>{grade.semester}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <EmptyState
                        icon={<BookOpen className="h-8 w-8" />}
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
                            <TableHead>Notities</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendance.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>
                                {new Date(record.date).toLocaleDateString('nl-NL')}
                              </TableCell>
                              <TableCell>{record.courseName}</TableCell>
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
                        icon={<ClipboardCheck className="h-8 w-8" />}
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
  );
}