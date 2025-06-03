import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileDown, Users, User, FileText, BarChart3, Target, Settings, Eye, Download, TrendingUp, Calculator, School, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('configure');
  const [selectedReportType, setSelectedReportType] = useState<'class' | 'individual'>('class');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [schoolName, setSchoolName] = useState('myMadrassa');
  const [reportPeriod, setReportPeriod] = useState('');
  const [generalComments, setGeneralComments] = useState('');
  const [attendanceComments, setAttendanceComments] = useState('');
  const [reportPreview, setReportPreview] = useState<ReportData[]>([]);
  const [behaviorGrades, setBehaviorGrades] = useState<{[key: number]: BehaviorGrade}>({});

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

  const generatePreviewData = () => {
    if (selectedReportType === 'class' && selectedClass) {
      const classStudents = students.filter((s: Student) => 
        classes.find((c: StudentGroup) => c.id.toString() === selectedClass)?.id
      ) || [];
      
      const previewData = classStudents.map((student: Student) => ({
        student,
        attendance: {
          total: 100,
          present: 85,
          absent: 10,
          late: 5,
          percentage: 85
        },
        grades: {},
        behavior: behaviorGrades[student.id] || { studentId: student.id, grade: 7, comments: '' },
        generalComments
      }));
      
      setReportPreview(previewData);
      setActiveTab('preview');
    } else if (selectedReportType === 'individual' && selectedStudent) {
      const student = students.find((s: Student) => s.id.toString() === selectedStudent);
      if (student) {
        const previewData = [{
          student,
          attendance: {
            total: 100,
            present: 85,
            absent: 10,
            late: 5,
            percentage: 85
          },
          grades: {},
          behavior: behaviorGrades[student.id] || { studentId: student.id, grade: 7, comments: '' },
          generalComments
        }];
        
        setReportPreview(previewData);
        setActiveTab('preview');
      }
    }
  };

  const generateReportData = () => {
    if (!reportPreview.length) {
      generatePreviewData();
      return;
    }

    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;

    reportPreview.forEach((studentData, studentIndex) => {
      if (studentIndex > 0) {
        pdf.addPage();
      }

      // Page 1: Grades and General Comments
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(schoolName, pageWidth / 2, 25, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.text('Schoolrapport', pageWidth / 2, 35, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Periode: ${reportPeriod}`, pageWidth / 2, 45, { align: 'center' });

      // Student info
      pdf.setFontSize(10);
      pdf.text(`Naam: ${studentData.student.firstName} ${studentData.student.lastName}`, margin, 60);
      pdf.text(`Student ID: ${studentData.student.studentId}`, margin, 68);
      pdf.text(`Academisch jaar: ${studentData.student.academicYear || 'Niet gespecificeerd'}`, margin, 76);

      // Grades table
      const gradeData = [
        ['VAK', 'TESTEN', 'TAKEN', 'EXAMEN', 'GEMIDDELDE', 'BEOORDELING']
      ];

      subjects.forEach((subject: any) => {
        const average = 7.5; // Mock data
        let assessment = '';
        if (average >= 8.5) assessment = 'Uitstekend';
        else if (average >= 7.5) assessment = 'Goed';
        else if (average >= 6.5) assessment = 'Voldoende';
        else assessment = 'Aandacht nodig';

        gradeData.push([
          subject.name,
          '8.0',
          '7.5',
          '7.0',
          average.toString(),
          assessment
        ]);
      });

      (pdf as any).autoTable({
        head: [gradeData[0]],
        body: gradeData.slice(1),
        startY: 90,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [249, 250, 251] }
      });

      // General comments
      const finalY = (pdf as any).lastAutoTable.finalY + 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ALGEMENE OPMERKINGEN', margin, finalY);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const commentLines = pdf.splitTextToSize(generalComments || 'Geen algemene opmerkingen', pageWidth - 2 * margin);
      pdf.text(commentLines, margin, finalY + 10);

      // Page 2: Behavior and Attendance
      pdf.addPage();
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(schoolName, pageWidth / 2, 25, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.text('Gedragsbeoordeling en Aanwezigheid', pageWidth / 2, 35, { align: 'center' });

      // Behavior section
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('GEDRAGSBEOORDELING', margin, 60);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Gedragscijfer: ${studentData.behavior.grade}/10`, margin, 75);
      pdf.text(`Opmerkingen: ${studentData.behavior.comments || 'Geen opmerkingen'}`, margin, 85);

      // Attendance section
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AANWEZIGHEID', margin, 110);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(`Aanwezigheidspercentage: ${studentData.attendance.percentage}%`, margin, 125);
      pdf.text(`Aanwezig: ${studentData.attendance.present} dagen`, margin, 135);
      pdf.text(`Afwezig: ${studentData.attendance.absent} dagen`, margin, 145);
      pdf.text(`Te laat: ${studentData.attendance.late} dagen`, margin, 155);
      
      if (attendanceComments) {
        const attendanceLines = pdf.splitTextToSize(attendanceComments, pageWidth - 2 * margin);
        pdf.text(attendanceLines, margin, 170);
      }

      // Signatures
      pdf.setFontSize(10);
      pdf.text('Handtekening ouder/voogd:', margin, pageHeight - 40);
      pdf.text('Handtekening school:', pageWidth - margin - 60, pageHeight - 40);
      
      pdf.text('Datum: ________________', margin, pageHeight - 25);
      pdf.text('Datum: ________________', pageWidth - margin - 60, pageHeight - 25);
    });

    const fileName = selectedReportType === 'class' 
      ? `Klasserapport_${classes.find((c: StudentGroup) => c.id.toString() === selectedClass)?.name || 'Onbekend'}_${new Date().toLocaleDateString('nl-NL')}.pdf`
      : `Individueel_Rapport_${reportPreview[0]?.student.firstName}_${reportPreview[0]?.student.lastName}_${new Date().toLocaleDateString('nl-NL')}.pdf`;
    
    pdf.save(fileName);
  };

  const filteredStudents = students.filter((student: Student) => {
    if (selectedReportType === 'class' && selectedClass) {
      const selectedClassData = classes.find((c: StudentGroup) => c.id.toString() === selectedClass);
      return selectedClassData;
    }
    return true;
  });

  return (
    <DataTableContainer>
      <PremiumHeader 
        title="Rapportage" 
        icon={FileText}
        description="Genereer professionele schoolrapporten met cijfers en beoordeling"
      />

      <div className="space-y-5">
        <Tabs 
          value={activeTab} 
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="grid w-full grid-cols-3 h-11">
            <TabsTrigger value="configure" className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuratie
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Voorvertoning
            </TabsTrigger>
            <TabsTrigger value="statistics" className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistieken
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                {/* Report Type Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Rapport Type
                    </CardTitle>
                    <CardDescription>
                      Kies het type rapport dat u wilt genereren
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedReportType === 'class' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedReportType('class')}
                      >
                        <div className="flex items-center gap-3">
                          <Users className={`h-6 w-6 ${selectedReportType === 'class' ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div>
                            <h3 className="font-semibold">Klasserapport</h3>
                            <p className="text-sm text-gray-600">Voor alle studenten in een klas</p>
                          </div>
                        </div>
                      </div>
                      <div 
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedReportType === 'individual' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedReportType('individual')}
                      >
                        <div className="flex items-center gap-3">
                          <User className={`h-6 w-6 ${selectedReportType === 'individual' ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div>
                            <h3 className="font-semibold">Individueel Rapport</h3>
                            <p className="text-sm text-gray-600">Voor één specifieke student</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Selection based on report type */}
                    {selectedReportType === 'class' ? (
                      <div className="space-y-2">
                        <Label>Selecteer Klas</Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                          <SelectTrigger>
                            <SelectValue placeholder="Kies een klas" />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((cls: StudentGroup) => (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                {cls.name} - {cls.academicYear}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Selecteer Student</Label>
                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                          <SelectTrigger>
                            <SelectValue placeholder="Kies een student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student: Student) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.firstName} {student.lastName} ({student.studentId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* School Configuration Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <School className="h-5 w-5 text-green-600" />
                      School Instellingen
                    </CardTitle>
                    <CardDescription>
                      Configureer de schoolgegevens voor het rapport
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Schoolnaam</Label>
                        <Input
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          placeholder="Naam van de school"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rapportperiode</Label>
                        <Input
                          value={reportPeriod}
                          onChange={(e) => setReportPeriod(e.target.value)}
                          placeholder="Q1 2024"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Comments Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      Opmerkingen & Notities
                    </CardTitle>
                    <CardDescription>
                      Voeg algemene opmerkingen toe voor het rapport
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Algemene Opmerkingen</Label>
                      <Textarea
                        value={generalComments}
                        onChange={(e) => setGeneralComments(e.target.value)}
                        placeholder="Voeg algemene opmerkingen toe voor het rapport..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Aanwezigheid Opmerkingen</Label>
                      <Textarea
                        value={attendanceComments}
                        onChange={(e) => setAttendanceComments(e.target.value)}
                        placeholder="Voeg opmerkingen toe over aanwezigheid..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-blue-600" />
                      Acties
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={generatePreviewData}
                      disabled={!selectedClass && !selectedStudent}
                      className="w-full"
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Bekijk Voorvertoning
                    </Button>

                    <Button 
                      onClick={generateReportData}
                      disabled={!selectedClass && !selectedStudent}
                      className="w-full"
                      size="lg"
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Genereer PDF Rapport
                    </Button>
                    
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <h4 className="font-medium text-sm">Rapport bevat:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Pagina 1: Cijfertabel en algemene opmerkingen
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Pagina 2: Gedragsbeoordeling en aanwezigheid
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Handtekeningvelden voor ouders en school
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                      Overzicht
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Totaal klassen:</span>
                      <Badge variant="secondary">{classes.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Totaal studenten:</span>
                      <Badge variant="secondary">{students.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Vakken:</span>
                      <Badge variant="secondary">{subjects.length}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {reportPreview.length > 0 ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Rapportoverzicht & Commentaren</h3>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {reportPreview.length} student{reportPreview.length !== 1 ? 'en' : ''}
                  </Badge>
                </div>
                
                <div className="grid gap-6">
                  {reportPreview.map((student, index) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="bg-gray-50 border-b">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">
                              {student.student.firstName} {student.student.lastName}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              Student ID: {student.student.studentId} • {student.student.academicYear || 'Academisch jaar onbekend'}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={student.attendance.percentage >= 85 ? "default" : "destructive"}>
                              {student.attendance.percentage.toFixed(1)}% aanwezigheid
                            </Badge>
                            <Badge variant={student.behavior.grade >= 7 ? "default" : "secondary"}>
                              Gedrag: {student.behavior.grade}/10
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-6">
                        {/* Samenvatting in één oogopslag */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{student.attendance.present}</div>
                            <div className="text-sm text-gray-600">Aanwezig</div>
                          </div>
                          <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{student.attendance.absent}</div>
                            <div className="text-sm text-gray-600">Afwezig</div>
                          </div>
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">{student.attendance.late}</div>
                            <div className="text-sm text-gray-600">Te laat</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">7.5</div>
                            <div className="text-sm text-gray-600">Gem. cijfer</div>
                          </div>
                        </div>

                        {/* Vakken overzicht */}
                        <div className="mb-6">
                          <h5 className="font-semibold mb-3 flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            Vakken & Cijfers
                          </h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {subjects.slice(0, 8).map((subject: any, subjectIndex: number) => (
                              <div key={subjectIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm font-medium">{subject.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {(7.5 + Math.random() * 1.5).toFixed(1)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Commentaren sectie */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-semibold mb-2 block">
                                Gedragsopmerkingen
                              </Label>
                              <Textarea
                                placeholder="Voeg opmerkingen toe over gedrag en sociale vaardigheden..."
                                value={behaviorGrades[student.student.id]?.comments || ''}
                                onChange={(e) => setBehaviorGrades(prev => ({
                                  ...prev,
                                  [student.student.id]: {
                                    ...prev[student.student.id],
                                    studentId: student.student.id,
                                    grade: prev[student.student.id]?.grade || 7,
                                    comments: e.target.value
                                  }
                                }))}
                                rows={3}
                                className="resize-none"
                              />
                            </div>
                            
                            <div>
                              <Label className="text-sm font-semibold mb-2 block">
                                Gedragscijfer (1-10)
                              </Label>
                              <Select 
                                value={behaviorGrades[student.student.id]?.grade?.toString() || '7'} 
                                onValueChange={(value) => setBehaviorGrades(prev => ({
                                  ...prev,
                                  [student.student.id]: {
                                    ...prev[student.student.id],
                                    studentId: student.student.id,
                                    grade: parseInt(value),
                                    comments: prev[student.student.id]?.comments || ''
                                  }
                                }))}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {[1,2,3,4,5,6,7,8,9,10].map(grade => (
                                    <SelectItem key={grade} value={grade.toString()}>
                                      {grade}/10 {grade >= 8 ? '- Uitstekend' : grade >= 7 ? '- Goed' : grade >= 6 ? '- Voldoende' : '- Verbetering nodig'}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-semibold mb-2 block">
                                Aanwezigheidsopmerkingen
                              </Label>
                              <Textarea
                                placeholder="Specifieke opmerkingen over aanwezigheid, punctualiteit, etc..."
                                value={attendanceComments}
                                onChange={(e) => setAttendanceComments(e.target.value)}
                                rows={3}
                                className="resize-none"
                              />
                            </div>

                            <div>
                              <Label className="text-sm font-semibold mb-2 block">
                                Algemene opmerkingen
                              </Label>
                              <Textarea
                                placeholder="Algemene feedback, sterke punten, verbeterpunten..."
                                value={generalComments}
                                onChange={(e) => setGeneralComments(e.target.value)}
                                rows={3}
                                className="resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-center gap-4">
                  <Button onClick={() => generatePreviewData()} variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Ververs voorvertoning
                  </Button>
                  <Button onClick={generateReportData} size="lg">
                    <FileDown className="h-4 w-4 mr-2" />
                    Download PDF Rapport
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-12 w-12 text-gray-400 mx-auto mb-4">
                  <FileText className="h-full w-full" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen rapportgegevens</h3>
                <p className="text-gray-600 mb-4">Configureer eerst uw rapport instellingen om een voorvertoning te zien.</p>
                <Button onClick={() => setActiveTab('configure')} variant="outline">
                  Ga naar configuratie
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Totaal Klassen</p>
                      <p className="text-2xl font-bold">{classes.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Totaal Studenten</p>
                      <p className="text-2xl font-bold">{students.length}</p>
                    </div>
                    <User className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Vakken</p>
                      <p className="text-2xl font-bold">{subjects.length}</p>
                    </div>
                    <Calculator className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rapporten</p>
                      <p className="text-2xl font-bold">{reportPreview.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DataTableContainer>
  );
}