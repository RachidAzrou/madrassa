import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Settings, Eye, FileDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  programId: number | null;
  academicYear: string | null;
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

interface BehaviorGrade {
  studentId: number;
  grade: number;
  comments: string;
}

interface ReportData {
  student: Student;
  attendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  grades: {
    [subject: string]: {
      tests: Grade[];
      tasks: Grade[];
      homework: Grade[];
      average: number;
    };
  };
  behavior: BehaviorGrade;
  generalComments: string;
}

export default function Reports() {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('configure');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportPreview, setReportPreview] = useState<ReportData[]>([]);
  const [behaviorGrades, setBehaviorGrades] = useState<{[key: number]: BehaviorGrade}>({});

  // Fetch data
  const { data: students = [] } = useQuery({ queryKey: ['/api/students'] });
  const { data: classes = [] } = useQuery({ queryKey: ['/api/student-groups'] });
  const { data: grades = [] } = useQuery({ queryKey: ['/api/grades'] });
  const { data: attendance = [] } = useQuery({ queryKey: ['/api/attendance'] });

  // Mock data generation functions
  const generatePreviewData = () => {
    let studentsToProcess: Student[] = [];
    
    if (selectedClass) {
      studentsToProcess = students.filter((student: Student) => 
        classes.find((c: StudentGroup) => c.id.toString() === selectedClass)?.id
      );
    } else if (selectedStudent) {
      const student = students.find((s: Student) => s.id.toString() === selectedStudent);
      if (student) studentsToProcess = [student];
    }

    const previewData = studentsToProcess.map((student: Student) => ({
      student,
      attendance: {
        total: 180,
        present: Math.floor(Math.random() * 20) + 150,
        absent: Math.floor(Math.random() * 15) + 5,
        late: Math.floor(Math.random() * 10) + 2,
        percentage: Math.floor(Math.random() * 20) + 80
      },
      grades: {
        'Arabisch': {
          tests: [],
          tasks: [],
          homework: [],
          average: Math.random() * 3 + 6.5
        },
        'Koran': {
          tests: [],
          tasks: [],
          homework: [],
          average: Math.random() * 3 + 6.5
        },
        'Islamitische Studies': {
          tests: [],
          tasks: [],
          homework: [],
          average: Math.random() * 3 + 6.5
        }
      },
      behavior: behaviorGrades[student.id] || { studentId: student.id, grade: 4, comments: '' },
      generalComments: ''
    }));

    setReportPreview(previewData);
    setActiveTab('preview');
    
    toast({
      title: "Voorvertoning gegenereerd",
      description: `${previewData.length} rapporten gegenereerd`,
    });
  };

  const generateReportData = () => {
    if (reportPreview.length === 0) return;

    const doc = new jsPDF();
    
    reportPreview.forEach((data, index) => {
      if (index > 0) doc.addPage();
      
      // Header
      doc.setFontSize(20);
      doc.text('myMadrassa Rapport', 20, 30);
      
      // Student info
      doc.setFontSize(12);
      doc.text(`Student: ${data.student.firstName} ${data.student.lastName}`, 20, 50);
      doc.text(`Student ID: ${data.student.studentId}`, 20, 60);
      doc.text(`Academisch Jaar: ${data.student.academicYear || 'Onbekend'}`, 20, 70);
      
      // Attendance
      doc.text('Aanwezigheid:', 20, 90);
      doc.text(`Aanwezig: ${data.attendance.present} dagen (${data.attendance.percentage}%)`, 30, 100);
      doc.text(`Afwezig: ${data.attendance.absent} dagen`, 30, 110);
      doc.text(`Te laat: ${data.attendance.late} keer`, 30, 120);
      
      // Grades
      doc.text('Cijfers:', 20, 140);
      let yPos = 150;
      Object.entries(data.grades).forEach(([subject, gradeData]) => {
        doc.text(`${subject}: ${gradeData.average.toFixed(1)}`, 30, yPos);
        yPos += 10;
      });
      
      // Behavior
      doc.text(`Gedragscijfer: ${data.behavior.grade}/5`, 20, yPos + 10);
      if (data.behavior.comments) {
        doc.text(`Opmerking: ${data.behavior.comments}`, 20, yPos + 20);
      }
    });

    doc.save('rapporten.pdf');
    
    toast({
      title: "PDF gegenereerd",
      description: "Rapporten zijn gedownload als PDF",
    });
  };

  // Filter students based on selected class
  const filteredStudents = students.filter((student: Student) => {
    if (selectedClass) {
      const classStudents = students.filter((s: Student) => 
        classes.find((c: StudentGroup) => c.id.toString() === selectedClass)?.id
      );
      return classStudents.includes(student);
    }
    return true;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center">
            <div className="mr-3 text-[#1e3a8a] bg-blue-100 rounded-lg p-2">
              <FileText className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1e3a8a]">Rapportage</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-11">
            Genereer professionele schoolrapporten met cijfers en beoordeling
          </p>
        </div>
      </div>
      
      {/* Acties onder de streep */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <Button variant="outline" className="flex items-center w-full md:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Rapporten Exporteren
        </Button>
        <Button 
          className="flex items-center w-full md:w-auto bg-primary"
          onClick={generateReportData}
          disabled={!selectedClass && !selectedStudent}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Rapport Genereren
        </Button>
      </div>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value)} 
        className="space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <TabsList className="grid grid-cols-2 w-full md:w-[400px] p-1 bg-blue-900/10">
            <TabsTrigger value="configure" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
              <Settings className="h-4 w-4 mr-2" />
              Configuratie
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
              <Eye className="h-4 w-4 mr-2" />
              Voorvertoning
            </TabsTrigger>
          </TabsList>
          
          <Button
            variant="outline"
            size="sm"
            onClick={generatePreviewData}
            disabled={!selectedClass && !selectedStudent}
            className="hidden md:flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Voorvertoning
          </Button>
        </div>

        <TabsContent value="configure" className="space-y-4">
          {/* Course and assessment selector */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Selecteer een klas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls: StudentGroup) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name} ({cls.academicYear})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Selecteer student" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStudents.map((student: Student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.firstName} {student.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="Rapporttype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trimester">Trimester</SelectItem>
                      <SelectItem value="semester">Semester</SelectItem>
                      <SelectItem value="annual">Jaarrapport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Grading table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {!selectedClass && !selectedStudent ? (
              <div className="p-8 text-center">
                <h3 className="text-gray-500 text-lg font-medium">
                  Selecteer een klas of student
                </h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gedragscijfer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opmerkingen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                {student.firstName?.[0]}{student.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.studentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            value={behaviorGrades[student.id]?.grade || ''}
                            onChange={(e) => {
                              const grade = parseInt(e.target.value);
                              if (grade >= 1 && grade <= 5) {
                                setBehaviorGrades(prev => ({
                                  ...prev,
                                  [student.id]: {
                                    ...prev[student.id],
                                    grade,
                                    comments: prev[student.id]?.comments || ''
                                  }
                                }));
                              }
                            }}
                            className="w-16 text-center"
                            placeholder="1-5"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input
                            type="text"
                            value={behaviorGrades[student.id]?.comments || ''}
                            onChange={(e) => {
                              setBehaviorGrades(prev => ({
                                ...prev,
                                [student.id]: {
                                  ...prev[student.id],
                                  grade: prev[student.id]?.grade || 0,
                                  comments: e.target.value
                                }
                              }));
                            }}
                            className="min-w-[200px]"
                            placeholder="Opmerking..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {reportPreview.length === 0 ? (
              <div className="p-8 text-center">
                <h3 className="text-gray-500 text-lg font-medium">
                  Geen voorvertoning beschikbaar
                </h3>
                <p className="text-sm text-gray-400 mt-2">
                  Genereer eerst een voorvertoning vanuit de configuratie
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {reportPreview.map((data, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {data.student.firstName[0]}{data.student.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {data.student.firstName} {data.student.lastName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Student ID: {data.student.studentId}
                          </p>
                        </div>
                      </div>
                      <Badge variant={data.attendance.percentage >= 80 ? "default" : "destructive"}>
                        {data.attendance.percentage.toFixed(1)}% Aanwezigheid
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Cijfers per Vak</h5>
                        <div className="space-y-2">
                          {Object.entries(data.grades).map(([subject, gradeData]) => (
                            <div key={subject} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm font-medium">{subject}</span>
                              <Badge variant={gradeData.average >= 6.5 ? "default" : "secondary"}>
                                {gradeData.average.toFixed(1)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">Prestatie Overzicht</h5>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Totaal Aanwezig:</span>
                            <span className="font-medium">{data.attendance.present} dagen</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Gedragscijfer:</span>
                            <Badge variant={data.behavior.grade >= 4 ? "default" : "secondary"}>
                              {data.behavior.grade}/5
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        </Tabs>
    </div>
  );
}