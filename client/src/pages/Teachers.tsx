import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  FileDown, 
  Eye, 
  Edit, 
  Trash2, 
  User, 
  Save,
  X,
  GraduationCap,
  Languages,
  BookOpen
} from 'lucide-react';
import { DialogHeaderWithIcon } from '@/components/ui/dialog-header-with-icon';
import { DataTableContainer } from '@/components/ui/data-table-container';

type TeacherType = {
  id: number;
  teacherId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialty?: string;
  bio?: string;
  dateOfBirth?: string;
  hireDate?: string;
  status: string;
  photoUrl?: string;
};

type SubjectType = {
  id: number;
  name: string;
  code: string;
};

const mockTeachers: TeacherType[] = [
  {
    id: 1,
    teacherId: "DC001",
    firstName: "Ahmed",
    lastName: "Al-Rashid",
    email: "ahmed.rashid@madrassa.nl",
    phone: "06-12345678",
    specialty: "Arabisch & Islamitische Studies",
    status: "Actief",
    hireDate: "2020-09-01",
    dateOfBirth: "1985-03-15",
    photoUrl: "/api/placeholder/150/150"
  },
  {
    id: 2,
    teacherId: "DC002", 
    firstName: "Fatima",
    lastName: "El-Mansouri",
    email: "fatima.mansouri@madrassa.nl",
    phone: "06-87654321",
    specialty: "Koran Studies",
    status: "Actief",
    hireDate: "2019-08-15",
    dateOfBirth: "1982-07-22",
    photoUrl: "/api/placeholder/150/150"
  }
];

const mockSubjects: SubjectType[] = [
  { id: 1, name: "Arabisch", code: "AR" },
  { id: 2, name: "Koran Studies", code: "KS" },
  { id: 3, name: "Islamitische Geschiedenis", code: "IG" },
  { id: 4, name: "Hadith Studies", code: "HS" },
  { id: 5, name: "Fiqh (Islamitisch Recht)", code: "FQ" }
];

export default function Teachers() {
  const [teachers, setTeachers] = useState<TeacherType[]>(mockTeachers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);
  const [showNewTeacherDialog, setShowNewTeacherDialog] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [hasValidationAttempt, setHasValidationAttempt] = useState(false);

  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    hireDate: new Date().toISOString().split('T')[0],
    specialty: '',
    status: '',
    bio: '',
    photoUrl: ''
  });

  const searchResults = teachers.filter((teacher: TeacherType) => 
    teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.teacherId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedTeachers.length === searchResults.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(searchResults.map((teacher: TeacherType) => teacher.id));
    }
  };

  const handleViewTeacher = (teacher: TeacherType) => {
    console.log('View teacher:', teacher);
  };

  const handleEditTeacher = (teacher: TeacherType) => {
    console.log('Edit teacher:', teacher);
  };

  const handleDeleteTeacher = (teacher: TeacherType) => {
    if (window.confirm(`Weet je zeker dat je ${teacher.firstName} ${teacher.lastName} wilt verwijderen?`)) {
      setTeachers(prev => prev.filter(t => t.id !== teacher.id));
    }
  };

  const validateTeacherForm = () => {
    return newTeacher.firstName.trim() !== '' &&
           newTeacher.lastName.trim() !== '' &&
           newTeacher.email.trim() !== '' &&
           newTeacher.email.includes('@') &&
           newTeacher.phone.trim() !== '' &&
           newTeacher.hireDate.trim() !== '' &&
           newTeacher.status.trim() !== '';
  };

  const handleSaveTeacher = () => {
    setHasValidationAttempt(true);
    
    if (!validateTeacherForm()) {
      return;
    }

    const teacherCount = teachers.length + 1;
    const teacherId = `DC${teacherCount.toString().padStart(3, '0')}`;

    const newTeacherData: TeacherType = {
      id: Date.now(),
      teacherId,
      firstName: newTeacher.firstName,
      lastName: newTeacher.lastName,
      email: newTeacher.email,
      phone: newTeacher.phone,
      specialty: newTeacher.specialty,
      bio: newTeacher.bio,
      dateOfBirth: newTeacher.dateOfBirth,
      hireDate: newTeacher.hireDate,
      status: newTeacher.status,
      photoUrl: newTeacher.photoUrl
    };

    setTeachers(prev => [...prev, newTeacherData]);
    resetTeacherForm();
    setShowNewTeacherDialog(false);
  };

  const resetTeacherForm = () => {
    setNewTeacher({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      hireDate: new Date().toISOString().split('T')[0],
      specialty: '',
      status: '',
      bio: '',
      photoUrl: ''
    });
    setSelectedSubjects([]);
    setHasValidationAttempt(false);
  };

  const handleExport = (format: string) => {
    console.log(`Exporting teachers in ${format} format`);
    setIsExportDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <DataTableContainer
        title="Docenten"
        description="Beheer docenten en hun informatie"
        icon={<GraduationCap className="h-5 w-5" />}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Zoek docenten..."
        onAddNew={() => setShowNewTeacherDialog(true)}
        addNewLabel="Nieuwe Docent"
        onExport={() => setIsExportDialogOpen(true)}
        selectedCount={selectedTeachers.length}
        totalCount={searchResults.length}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTeachers.length === searchResults.length && searchResults.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Docent ID</TableHead>
              <TableHead>Naam</TableHead>
              <TableHead>Vakken</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {searchResults.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {searchTerm ? 'Geen docenten gevonden voor deze zoekopdracht.' : 'Geen docenten gevonden.'}
                </TableCell>
              </TableRow>
            ) : (
              searchResults.map((teacher: TeacherType) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTeachers.includes(teacher.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTeachers(prev => [...prev, teacher.id]);
                        } else {
                          setSelectedTeachers(prev => prev.filter(id => id !== teacher.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {teacher.photoUrl ? (
                        <img 
                          src={teacher.photoUrl} 
                          alt={`${teacher.firstName} ${teacher.lastName}`}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <span className="font-medium">{teacher.teacherId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
                      <div className="text-sm text-gray-500">{teacher.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{teacher.specialty || 'Niet gespecificeerd'}</span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={teacher.status === 'Actief' ? 'default' : 'secondary'}
                      className={teacher.status === 'Actief' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                    >
                      {teacher.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewTeacher(teacher)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTeacher(teacher)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTeacher(teacher)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DataTableContainer>

      {/* Nieuwe Docent Dialog */}
      <Dialog open={showNewTeacherDialog} onOpenChange={setShowNewTeacherDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeaderWithIcon
            icon={<GraduationCap className="h-5 w-5" />}
            title="Nieuwe Docent Toevoegen"
            description="Vul de docentgegevens in om een nieuwe docent toe te voegen"
          />
          
          <div className="p-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basisgegevens</TabsTrigger>
                <TabsTrigger value="subjects">Vakken</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      Voornaam <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={newTeacher.firstName}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, firstName: e.target.value }))}
                      className={`mt-1 ${hasValidationAttempt && !newTeacher.firstName ? 'border-red-500' : ''}`}
                      placeholder="Voornaam"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Achternaam <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={newTeacher.lastName}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, lastName: e.target.value }))}
                      className={`mt-1 ${hasValidationAttempt && !newTeacher.lastName ? 'border-red-500' : ''}`}
                      placeholder="Achternaam"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      E-mail <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={newTeacher.email}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, email: e.target.value }))}
                      className={`mt-1 ${hasValidationAttempt && (!newTeacher.email || !newTeacher.email.includes('@')) ? 'border-red-500' : ''}`}
                      placeholder="email@voorbeeld.nl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Telefoon <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={newTeacher.phone}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, phone: e.target.value }))}
                      className={`mt-1 ${hasValidationAttempt && !newTeacher.phone ? 'border-red-500' : ''}`}
                      placeholder="06-12345678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hireDate" className="text-sm font-medium">
                      Startdatum <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={newTeacher.hireDate}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, hireDate: e.target.value }))}
                      className={`mt-1 ${hasValidationAttempt && !newTeacher.hireDate ? 'border-red-500' : ''}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <Select value={newTeacher.status} onValueChange={(value) => setNewTeacher(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger className={`mt-1 ${hasValidationAttempt && !newTeacher.status ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Selecteer status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Actief">Actief</SelectItem>
                        <SelectItem value="Niet actief">Niet actief</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newTeacher.photoUrl && (
                  <div className="flex justify-center">
                    <img 
                      src={newTeacher.photoUrl} 
                      alt="Docent foto" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="photo" className="text-sm font-medium">
                    Profielfoto
                  </Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setNewTeacher(prev => ({
                            ...prev,
                            photoUrl: reader.result as string
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="mt-1"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="subjects" className="space-y-6 mt-6">
                <div>
                  <Label className="text-sm font-medium">Vakken</Label>
                  <p className="text-sm text-gray-600 mt-1">Selecteer de vakken die deze docent onderwijst.</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                    {mockSubjects.map((subject) => (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`subject-${subject.id}`}
                          checked={selectedSubjects.includes(subject.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSubjects(prev => [...prev, subject.id]);
                            } else {
                              setSelectedSubjects(prev => prev.filter(id => id !== subject.id));
                            }
                          }}
                        />
                        <Label 
                          htmlFor={`subject-${subject.id}`} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {subject.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                      Geboortedatum
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={newTeacher.dateOfBirth}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialty" className="text-sm font-medium">
                      Specialisatie
                    </Label>
                    <Input
                      id="specialty"
                      value={newTeacher.specialty}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, specialty: e.target.value }))}
                      className="mt-1"
                      placeholder="Arabisch & Islamitische Studies"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="bio" className="text-sm font-medium">
                      Biografie
                    </Label>
                    <Textarea
                      id="bio"
                      value={newTeacher.bio}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, bio: e.target.value }))}
                      className="mt-1"
                      placeholder="Biografie van de docent..."
                      rows={4}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <Button 
              variant="outline" 
              onClick={() => {
                resetTeacherForm();
                setShowNewTeacherDialog(false);
              }}
            >
              Annuleren
            </Button>
            <Button 
              onClick={handleSaveTeacher}
              className="bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              <Save className="h-4 w-4 mr-2" />
              Docent Toevoegen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
          <DialogHeaderWithIcon
            icon={<FileDown className="h-5 w-5" />}
            title="Docenten Exporteren"
            description="Selecteer het formaat om de docentenlijst te exporteren"
          />
          
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Exportformaat</label>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" className="justify-start" onClick={() => handleExport('excel')}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Excel (.xlsx)
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleExport('csv')}>
                  <FileDown className="h-4 w-4 mr-2" />
                  CSV (.csv)
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => handleExport('pdf')}>
                  <FileDown className="h-4 w-4 mr-2" />
                  PDF (.pdf)
                </Button>
              </div>
            </div>
            
            {selectedTeachers.length > 0 && (
              <p className="text-sm text-gray-600">
                {selectedTeachers.length} docent(en) geselecteerd voor export.
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50">
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Annuleren
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}