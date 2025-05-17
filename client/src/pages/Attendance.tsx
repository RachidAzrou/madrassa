import { useState } from 'react';
import { 
  Search, Download, Filter, CheckCircle, XCircle, Clock, 
  ArrowLeft, ArrowRight, Save, User, MessageSquare, 
  AlertCircle, ClipboardCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Attendance() {
  const [selectedType, setSelectedType] = useState<'vak' | 'klas'>('vak');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Voorbeeld data
  const courses = [
    { id: 1, name: 'Arabische Taal', code: 'AT101' },
    { id: 2, name: 'Fiqh', code: 'FQ102' },
    { id: 3, name: 'Islamitische Ethiek', code: 'IE103' }
  ];
  
  const classes = [
    { id: 1, name: 'Klas 1A' },
    { id: 2, name: 'Klas 2B' },
    { id: 3, name: 'Klas 3C' }
  ];
  
  // Voorbeeld studenten
  const students = [
    { id: 1, firstName: 'Ahmed', lastName: 'El Amrani', status: 'present', attendanceRate: 95 },
    { id: 2, firstName: 'Fatima', lastName: 'Bencherif', status: 'absent', attendanceRate: 85 },
    { id: 3, firstName: 'Omar', lastName: 'El Khatib', status: 'late', attendanceRate: 90 }
  ];
  
  const teachers = [
    { id: 1, firstName: 'Mohammed', lastName: 'Al Farsi', specialty: 'Arabische Taal' },
    { id: 2, firstName: 'Aisha', lastName: 'El Mansouri', specialty: 'Fiqh' }
  ];

  const handleDateChange = (increment: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + increment);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
    setSelectedType('vak');
    setSelectedClass('');
  };
  
  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedType('klas');
    setSelectedCourse('');
  };

  // Format date as "Day Month Year" in Dutch format
  const formatDate = (dateInput: string | Date) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center">
            <div className="mr-3 text-[#1e3a8a] bg-blue-100 rounded-lg p-2">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1e3a8a]">Aanwezigheid</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-11">
            Registreer en beheer aanwezigheid van studenten en docenten
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Datum selectie paneel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-900" />
              Datum
            </CardTitle>
            <p className="text-sm font-medium text-gray-700">{formatDate(selectedDate)}</p>
            <p className="text-sm text-gray-500">Selecteer een datum om aanwezigheid te registreren</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-6">
              <div className="flex space-x-3">
                <Button variant="outline" size="sm" onClick={() => handleDateChange(-1)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-1" /> 
                  <span>Vorige dag</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDateChange(1)} className="flex-1">
                  <span>Volgende dag</span> <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="flex justify-between text-sm text-gray-500 px-1">
                <div>
                  {(() => {
                    const prevDate = new Date(selectedDate);
                    prevDate.setDate(prevDate.getDate() - 1);
                    return formatDate(prevDate);
                  })()}
                </div>
                <div>
                  {(() => {
                    const nextDate = new Date(selectedDate);
                    nextDate.setDate(nextDate.getDate() + 1);
                    return formatDate(nextDate);
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Filters */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-900 flex items-center">
              <Filter className="h-5 w-5 mr-2 text-blue-900" />
              Filters
            </CardTitle>
            <p className="text-sm text-gray-500">Selecteer gegevens om de aanwezigheid te filteren</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="vak" onValueChange={(value) => setSelectedType(value as 'vak' | 'klas')}>
              <TabsList className="w-full mb-4 bg-blue-900/10">
                <TabsTrigger value="vak">Vak</TabsTrigger>
                <TabsTrigger value="klas">Klas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="vak">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vak</label>
                  <Select value={selectedCourse} onValueChange={handleCourseChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecteer vak" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="klas">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Klas</label>
                  <Select value={selectedClass} onValueChange={handleClassChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecteer klas" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(classroom => (
                        <SelectItem key={classroom.id} value={classroom.id.toString()}>
                          {classroom.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Content */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-900 flex items-center">
            <ClipboardCheck className="h-5 w-5 mr-2 text-blue-900" />
            Aanwezigheidsregistratie
          </CardTitle>
          <p className="text-sm text-gray-500">Registreer en beheer de aanwezigheid van studenten en docenten</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="students">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-blue-900/10 mb-6">
              <TabsTrigger value="students" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Studenten
              </TabsTrigger>
              <TabsTrigger value="teachers" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Docenten
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="students">
              <div className="space-y-4">
                <div className="flex justify-between mb-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => console.log('Mark all present')} className="border-green-600 text-green-600 hover:bg-green-50">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Allen aanwezig
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => console.log('Mark all absent')} className="border-red-600 text-red-600 hover:bg-red-50">
                      <XCircle className="h-4 w-4 mr-2" />
                      Allen afwezig
                    </Button>
                  </div>
                  
                  <Button variant="default" size="sm" className="bg-blue-900 hover:bg-blue-800" onClick={() => console.log('Save attendance')}>
                    <Save className="h-4 w-4 mr-2" />
                    Opslaan
                  </Button>
                </div>
                
                <div className="rounded-md border shadow-sm overflow-hidden">
                  <div className="grid grid-cols-5 bg-slate-100 p-3 text-xs font-medium text-slate-700">
                    <div>Student</div>
                    <div>Opmerking</div>
                    <div>Aanwezigheid %</div>
                    <div className="col-span-2 text-right">Acties</div>
                  </div>
                  <div className="divide-y bg-white">
                    {students.map(student => (
                      <div key={student.id} className="grid grid-cols-5 items-center p-3 hover:bg-gray-50">
                        <div className="font-medium">{student.firstName} {student.lastName}</div>
                        <div>
                          <Button variant="ghost" size="icon" onClick={() => console.log('Add note')} className="h-8 w-8">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">{student.attendanceRate}%</span>
                        </div>
                        <div className="col-span-2 flex justify-end gap-2">
                          <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => console.log('Mark present')}>
                            Aanwezig
                          </Button>
                          <Button variant="outline" size="sm" className="text-amber-600 border-amber-600 hover:bg-amber-50" onClick={() => console.log('Mark late')}>
                            Te laat
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => console.log('Mark absent')}>
                            Afwezig
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="teachers">
              <div className="space-y-4">
                <div className="flex justify-between mb-4">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => console.log('Mark all present')} className="border-green-600 text-green-600 hover:bg-green-50">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Allen aanwezig
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => console.log('Mark all absent')} className="border-red-600 text-red-600 hover:bg-red-50">
                      <XCircle className="h-4 w-4 mr-2" />
                      Allen afwezig
                    </Button>
                  </div>
                  
                  <Button variant="default" size="sm" className="bg-blue-900 hover:bg-blue-800" onClick={() => console.log('Save attendance')}>
                    <Save className="h-4 w-4 mr-2" />
                    Opslaan
                  </Button>
                </div>
                
                <div className="rounded-md border shadow-sm overflow-hidden">
                  <div className="grid grid-cols-3 bg-slate-100 p-3 text-xs font-medium text-slate-700">
                    <div>Docent</div>
                    <div>Specialisatie</div>
                    <div className="text-right">Acties</div>
                  </div>
                  <div className="divide-y bg-white">
                    {teachers.map(teacher => (
                      <div key={teacher.id} className="grid grid-cols-3 items-center p-3 hover:bg-gray-50">
                        <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
                        <div>{teacher.specialty}</div>
                        <div className="flex justify-end gap-2">
                          <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => console.log('Mark present')}>
                            Aanwezig
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => console.log('Mark absent')}>
                            Afwezig
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => console.log('Add note')} className="h-8 w-8">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}