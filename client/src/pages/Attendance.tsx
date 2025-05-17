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

export default function Attendance() {
  const [selectedTab, setSelectedTab] = useState<'students' | 'teachers'>('students');
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
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="w-full text-center md:text-left">
          <h2 className="text-xl font-semibold text-gray-800">{formatDate(selectedDate)}</h2>
          <p className="text-sm text-gray-500 mt-1">Selecteer een datum om aanwezigheid te registreren</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant={selectedTab === 'students' ? 'default' : 'outline'} 
            className="flex items-center gap-2" 
            onClick={() => setSelectedTab('students')}
          >
            <User className="h-4 w-4" />
            Studenten
          </Button>
          <Button 
            variant={selectedTab === 'teachers' ? 'default' : 'outline'} 
            className="flex items-center gap-2" 
            onClick={() => setSelectedTab('teachers')}
          >
            <User className="h-4 w-4" />
            Docenten
          </Button>
        </div>
      </div>
        
      <div className="flex justify-center space-x-3 mb-6">
        <Button variant="outline" size="sm" onClick={() => handleDateChange(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Vorige dag
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleDateChange(1)}>
          Volgende dag <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Selection and filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as 'vak' | 'klas')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecteer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vak">Vak</SelectItem>
                <SelectItem value="klas">Klas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedType === 'vak' && (
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
          )}
          
          {selectedType === 'klas' && (
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
          )}
        </div>
      </div>

      {/* Attendance Content */}
      {selectedTab === 'students' ? (
        <div className="space-y-4">
          <div className="flex justify-between mb-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => console.log('Mark all present')}>
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Allen aanwezig
              </Button>
              <Button variant="outline" size="sm" onClick={() => console.log('Mark all absent')}>
                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                Allen afwezig
              </Button>
            </div>
            
            <Button variant="default" size="sm" className="bg-primary" onClick={() => console.log('Save attendance')}>
              <Save className="h-4 w-4 mr-2" />
              Opslaan
            </Button>
          </div>
          
          <div className="rounded-md border">
            <div className="grid grid-cols-6 bg-slate-50 p-3 text-xs font-medium">
              <div>Student</div>
              <div>Status</div>
              <div>Opmerking</div>
              <div>Aanwezigheid</div>
              <div className="col-span-2 text-right">Acties</div>
            </div>
            <div className="divide-y">
              {students.map(student => (
                <div key={student.id} className="grid grid-cols-6 items-center p-3">
                  <div className="font-medium">{student.firstName} {student.lastName}</div>
                  <div>
                    {student.status === 'present' ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aanwezig</Badge>
                    ) : student.status === 'absent' ? (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Afwezig</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Te laat</Badge>
                    )}
                  </div>
                  <div>
                    <Button variant="ghost" size="icon" onClick={() => console.log('Add note')}>
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
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Docent Aanwezigheid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="grid grid-cols-4 bg-slate-50 p-3 text-xs font-medium">
                  <div>Docent</div>
                  <div>Specialisatie</div>
                  <div>Status</div>
                  <div className="text-right">Acties</div>
                </div>
                <div className="divide-y">
                  {teachers.map(teacher => (
                    <div key={teacher.id} className="grid grid-cols-4 items-center p-3">
                      <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
                      <div>{teacher.specialty}</div>
                      <div>
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aanwezig</Badge>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => console.log('Mark present')}>
                          Aanwezig
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => console.log('Mark absent')}>
                          Afwezig
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => console.log('Add note')}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}