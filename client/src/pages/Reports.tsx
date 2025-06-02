import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Upload, Users, User } from 'lucide-react';
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
  const [selectedReportType, setSelectedReportType] = useState<'class' | 'individual'>('class');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [behaviorGrades, setBehaviorGrades] = useState<{[key: number]: BehaviorGrade}>({});
  const [generalComments, setGeneralComments] = useState<{[key: number]: string}>({});
  const [schoolLogo, setSchoolLogo] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch student groups
  const { data: classesData } = useQuery({
    queryKey: ['/api/student-groups'],
    queryFn: async () => {
      const response = await fetch('/api/student-groups');
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    },
  });

  // Fetch students
  const { data: studentsData } = useQuery({
    queryKey: ['/api/students'],
    queryFn: async () => {
      const response = await fetch('/api/students');
      if (!response.ok) throw new Error('Failed to fetch students');
      return response.json();
    },
  });

  // Fetch academic periods
  const { data: periodsData } = useQuery({
    queryKey: ['/api/academic-periods'],
    queryFn: async () => {
      const response = await fetch('/api/academic-periods');
      if (!response.ok) throw new Error('Failed to fetch periods');
      return response.json();
    },
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSchoolLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateReportData = async () => {
    try {
      let targetStudents: Student[] = [];

      if (selectedReportType === 'class' && selectedClass) {
        // Get students in the selected class
        const classResponse = await fetch(`/api/students/class/${selectedClass}`);
        if (!classResponse.ok) throw new Error('Failed to fetch class students');
        targetStudents = await classResponse.json();
      } else if (selectedReportType === 'individual' && selectedStudent) {
        // Get single student
        const student = studentsData?.find((s: Student) => s.id.toString() === selectedStudent);
        if (student) targetStudents = [student];
      }

      const reports: ReportData[] = [];

      for (const student of targetStudents) {
        // Fetch attendance data
        const attendanceResponse = await fetch(`/api/attendance/student/${student.id}`);
        const attendanceData: AttendanceRecord[] = attendanceResponse.ok ? await attendanceResponse.json() : [];

        // Calculate attendance statistics
        const total = attendanceData.length;
        const present = attendanceData.filter(a => a.status === 'present').length;
        const absent = attendanceData.filter(a => a.status === 'absent').length;
        const late = attendanceData.filter(a => a.status === 'late').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        // Fetch grades data
        const gradesResponse = await fetch(`/api/grades/student/${student.id}`);
        const gradesData: Grade[] = gradesResponse.ok ? await gradesResponse.json() : [];

        // Group grades by subject and type
        const gradesBySubject: {[subject: string]: {tests: Grade[], tasks: Grade[], homework: Grade[], average: number}} = {};
        
        gradesData.forEach(grade => {
          const subject = grade.programName || `Vak ${grade.programId}`;
          if (!gradesBySubject[subject]) {
            gradesBySubject[subject] = { tests: [], tasks: [], homework: [], average: 0 };
          }
          
          switch (grade.gradeType.toLowerCase()) {
            case 'test':
            case 'toets':
              gradesBySubject[subject].tests.push(grade);
              break;
            case 'taak':
            case 'opdracht':
              gradesBySubject[subject].tasks.push(grade);
              break;
            case 'huiswerk':
              gradesBySubject[subject].homework.push(grade);
              break;
            default:
              gradesBySubject[subject].tests.push(grade);
          }
        });

        // Calculate averages per subject
        Object.keys(gradesBySubject).forEach(subject => {
          const subjectGrades = gradesBySubject[subject];
          const allGrades = [...subjectGrades.tests, ...subjectGrades.tasks, ...subjectGrades.homework];
          if (allGrades.length > 0) {
            const weightedSum = allGrades.reduce((sum, grade) => sum + (grade.score / grade.maxScore) * 10 * grade.weight, 0);
            const totalWeight = allGrades.reduce((sum, grade) => sum + grade.weight, 0);
            subjectGrades.average = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
          }
        });

        reports.push({
          student,
          attendance: { total, present, absent, late, percentage },
          grades: gradesBySubject,
          behavior: behaviorGrades[student.id] || { studentId: student.id, grade: 7, comments: '' },
          generalComments: generalComments[student.id] || ''
        });
      }

      setReportData(reports);
      toast({
        title: "Rapporten gegenereerd",
        description: `${reports.length} rapport(en) succesvol gegenereerd.`,
      });

    } catch (error) {
      console.error('Error generating report data:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het genereren van de rapporten.",
        variant: "destructive",
      });
    }
  };

  const generatePDF = () => {
    if (reportData.length === 0) {
      toast({
        title: "Geen data",
        description: "Genereer eerst rapportgegevens voordat je een PDF kunt maken.",
        variant: "destructive",
      });
      return;
    }

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;

    reportData.forEach((report, index) => {
      if (index > 0) pdf.addPage();

      let yPosition = 20;

      // Header with logo
      if (schoolLogo) {
        try {
          pdf.addImage(schoolLogo, 'JPEG', 10, 10, 30, 20);
        } catch (error) {
          console.warn('Could not add logo to PDF:', error);
        }
      }

      // School header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('myMadrassa - Leerlingenrapport', schoolLogo ? 50 : 20, 20);
      
      yPosition = 40;

      // Student info
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Leerlinggegevens', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Naam: ${report.student.firstName} ${report.student.lastName}`, 20, yPosition);
      pdf.text(`Leerlingnummer: ${report.student.studentId}`, 120, yPosition);
      
      yPosition += 8;
      if (report.student.dateOfBirth) {
        const birthDate = new Date(report.student.dateOfBirth);
        pdf.text(`Geboortedatum: ${birthDate.toLocaleDateString('nl-NL')}`, 20, yPosition);
      }
      pdf.text(`Academisch jaar: ${report.student.academicYear || 'Niet opgegeven'}`, 120, yPosition);

      yPosition += 20;

      // Attendance section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Aanwezigheid', 20, yPosition);
      
      yPosition += 10;
      const attendanceData = [
        ['Totaal lessen', report.attendance.total.toString()],
        ['Aanwezig', report.attendance.present.toString()],
        ['Afwezig', report.attendance.absent.toString()],
        ['Te laat', report.attendance.late.toString()],
        ['Aanwezigheidspercentage', `${report.attendance.percentage}%`]
      ];

      (pdf as any).autoTable({
        startY: yPosition,
        head: [['Type', 'Aantal']],
        body: attendanceData,
        theme: 'grid',
        margin: { left: 20, right: 20 },
        styles: { fontSize: 10 }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 20;

      // Grades section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Cijfers per vak', 20, yPosition);
      
      yPosition += 10;

      Object.entries(report.grades).forEach(([subject, grades]) => {
        const gradeData = [
          ['Tests', grades.tests.length > 0 ? (grades.tests.reduce((sum, g) => sum + (g.score/g.maxScore)*10, 0) / grades.tests.length).toFixed(1) : 'Geen'],
          ['Taken', grades.tasks.length > 0 ? (grades.tasks.reduce((sum, g) => sum + (g.score/g.maxScore)*10, 0) / grades.tasks.length).toFixed(1) : 'Geen'],
          ['Huiswerk', grades.homework.length > 0 ? (grades.homework.reduce((sum, g) => sum + (g.score/g.maxScore)*10, 0) / grades.homework.length).toFixed(1) : 'Geen'],
          ['Gemiddelde', grades.average.toFixed(1)]
        ];

        (pdf as any).autoTable({
          startY: yPosition,
          head: [[subject, 'Cijfer']],
          body: gradeData,
          theme: 'grid',
          margin: { left: 20, right: 20 },
          styles: { fontSize: 10 }
        });

        yPosition = (pdf as any).lastAutoTable.finalY + 15;
      });

      // Behavior section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Gedrag', 20, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Gedragscijfer: ${report.behavior.grade}/10`, 20, yPosition);
      
      yPosition += 8;
      if (report.behavior.comments) {
        pdf.text('Opmerkingen gedrag:', 20, yPosition);
        yPosition += 6;
        const comments = pdf.splitTextToSize(report.behavior.comments, pageWidth - 40);
        pdf.text(comments, 20, yPosition);
        yPosition += comments.length * 6;
      }

      yPosition += 10;

      // General comments
      if (report.generalComments) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Algemene opmerkingen', 20, yPosition);
        
        yPosition += 10;
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const generalComments = pdf.splitTextToSize(report.generalComments, pageWidth - 40);
        pdf.text(generalComments, 20, yPosition);
        yPosition += generalComments.length * 6 + 20;
      }

      // Signature section
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Handtekeningen', 20, yPosition);
      
      yPosition += 20;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Parent signature
      pdf.text('Handtekening ouder(s)/verzorger(s):', 20, yPosition);
      pdf.line(20, yPosition + 15, 90, yPosition + 15);
      pdf.text('Datum: ________________', 20, yPosition + 25);

      // Teacher signature  
      pdf.text('Handtekening klassenmentor:', 120, yPosition);
      pdf.line(120, yPosition + 15, 190, yPosition + 15);
      pdf.text('Datum: ________________', 120, yPosition + 25);
    });

    // Save PDF
    const className = selectedReportType === 'class' ? classesData?.find((c: StudentGroup) => c.id.toString() === selectedClass)?.name : '';
    const studentName = selectedReportType === 'individual' ? reportData[0]?.student.firstName + '_' + reportData[0]?.student.lastName : '';
    const filename = `rapport_${className || studentName}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    pdf.save(filename);

    toast({
      title: "PDF gegenereerd",
      description: `Rapport is opgeslagen als ${filename}`,
    });
  };

  const updateBehaviorGrade = (studentId: number, grade: number, comments: string) => {
    setBehaviorGrades(prev => ({
      ...prev,
      [studentId]: { studentId, grade, comments }
    }));
  };

  const updateGeneralComments = (studentId: number, comments: string) => {
    setGeneralComments(prev => ({
      ...prev,
      [studentId]: comments
    }));
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <FileText className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Rapporten</h1>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">Rapporten Genereren</TabsTrigger>
          <TabsTrigger value="preview">Voorvertoning & Bewerken</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rapport Instellingen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label htmlFor="logo">School Logo</Label>
                <div className="flex items-center gap-4">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Logo Uploaden
                  </Button>
                  {schoolLogo && (
                    <div className="flex items-center gap-2">
                      <img src={schoolLogo} alt="School logo" className="h-10 w-10 object-contain" />
                      <span className="text-sm text-green-600">Logo geüpload</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Report Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                <Card 
                  className={`cursor-pointer transition-colors ${selectedReportType === 'class' ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => setSelectedReportType('class')}
                >
                  <CardContent className="flex items-center justify-center p-6">
                    <Users className="h-8 w-8 mr-3 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Klasrapport</h3>
                      <p className="text-sm text-gray-600">Alle studenten van een klas</p>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-colors ${selectedReportType === 'individual' ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => setSelectedReportType('individual')}
                >
                  <CardContent className="flex items-center justify-center p-6">
                    <User className="h-8 w-8 mr-3 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Individueel Rapport</h3>
                      <p className="text-sm text-gray-600">Eén specifieke student</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Selection Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedReportType === 'class' && (
                  <div>
                    <Label htmlFor="class">Selecteer Klas</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kies een klas" />
                      </SelectTrigger>
                      <SelectContent>
                        {classesData?.map((cls: StudentGroup) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.name} - {cls.academicYear}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedReportType === 'individual' && (
                  <div>
                    <Label htmlFor="student">Selecteer Student</Label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Kies een student" />
                      </SelectTrigger>
                      <SelectContent>
                        {studentsData?.map((student: Student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.firstName} {student.lastName} ({student.studentId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="period">Rapportperiode</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer periode" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodsData?.map((period: any) => (
                        <SelectItem key={period.id} value={period.id.toString()}>
                          {period.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={generateReportData}
                  disabled={!((selectedReportType === 'class' && selectedClass) || (selectedReportType === 'individual' && selectedStudent))}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Rapporten Genereren
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {reportData.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Geen rapporten gegenereerd</h3>
                <p className="text-gray-500">Ga naar de "Rapporten Genereren" tab om rapporten aan te maken.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Panel - Edit Controls */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Rapport Bewerken ({reportData.length})</h2>
                  <Button onClick={generatePDF} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                </div>

                {reportData.map((report, index) => (
                  <Card key={index} className="border-2 border-blue-200">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-blue-900">{report.student.firstName} {report.student.lastName}</span>
                        <Badge variant="secondary" className="bg-blue-600 text-white">{report.student.studentId}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                      {/* Behavior Grade */}
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-semibold mb-3 text-yellow-800">Gedragsbeoordeling</h4>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label htmlFor={`behavior-grade-${report.student.id}`} className="text-yellow-700">Gedragscijfer (1-10)</Label>
                            <Input
                              id={`behavior-grade-${report.student.id}`}
                              type="number"
                              min="1"
                              max="10"
                              value={behaviorGrades[report.student.id]?.grade || 7}
                              onChange={(e) => updateBehaviorGrade(
                                report.student.id, 
                                parseInt(e.target.value), 
                                behaviorGrades[report.student.id]?.comments || ''
                              )}
                              className="border-yellow-300 focus:border-yellow-500"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`behavior-comments-${report.student.id}`} className="text-yellow-700">Opmerkingen gedrag</Label>
                            <Textarea
                              id={`behavior-comments-${report.student.id}`}
                              value={behaviorGrades[report.student.id]?.comments || ''}
                              onChange={(e) => updateBehaviorGrade(
                                report.student.id,
                                behaviorGrades[report.student.id]?.grade || 7,
                                e.target.value
                              )}
                              placeholder="Opmerkingen over gedrag..."
                              className="border-yellow-300 focus:border-yellow-500"
                              rows={3}
                            />
                          </div>
                        </div>
                      </div>

                      {/* General Comments */}
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <Label htmlFor={`general-comments-${report.student.id}`} className="text-green-800 font-semibold">Algemene opmerkingen</Label>
                        <Textarea
                          id={`general-comments-${report.student.id}`}
                          value={generalComments[report.student.id] || ''}
                          onChange={(e) => updateGeneralComments(report.student.id, e.target.value)}
                          placeholder="Algemene opmerkingen voor het rapport..."
                          rows={4}
                          className="mt-2 border-green-300 focus:border-green-500"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Right Panel - PDF Preview */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">PDF Voorvertoning</h2>
                
                {reportData.map((report, index) => (
                  <Card key={index} className="border-2 border-gray-300 shadow-lg">
                    <CardContent className="p-0">
                      {/* PDF-like preview */}
                      <div className="bg-white min-h-[800px] max-w-full mx-auto shadow-inner">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b-2 border-blue-600 bg-gradient-to-r from-blue-50 to-blue-100">
                          {schoolLogo && (
                            <img src={schoolLogo} alt="School logo" className="h-16 w-16 object-contain" />
                          )}
                          <div className="text-center flex-1">
                            <h1 className="text-2xl font-bold text-blue-900">myMadrassa</h1>
                            <p className="text-lg text-blue-700">Leerlingenrapport</p>
                          </div>
                          <div className="w-16"></div>
                        </div>

                        <div className="p-6 space-y-6">
                          {/* Student Info */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">Leerlinggegevens</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-semibold">Naam:</span> {report.student.firstName} {report.student.lastName}
                              </div>
                              <div>
                                <span className="font-semibold">Leerlingnummer:</span> {report.student.studentId}
                              </div>
                              {report.student.dateOfBirth && (
                                <div>
                                  <span className="font-semibold">Geboortedatum:</span> {new Date(report.student.dateOfBirth).toLocaleDateString('nl-NL')}
                                </div>
                              )}
                              <div>
                                <span className="font-semibold">Academisch jaar:</span> {report.student.academicYear || 'Niet opgegeven'}
                              </div>
                            </div>
                          </div>

                          {/* Attendance */}
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-lg font-bold text-blue-800 mb-3">Aanwezigheid</h3>
                            <div className="grid grid-cols-5 gap-4 text-center text-sm">
                              <div>
                                <div className="text-xl font-bold text-blue-600">{report.attendance.total}</div>
                                <div className="text-gray-600">Totaal lessen</div>
                              </div>
                              <div>
                                <div className="text-xl font-bold text-green-600">{report.attendance.present}</div>
                                <div className="text-gray-600">Aanwezig</div>
                              </div>
                              <div>
                                <div className="text-xl font-bold text-red-600">{report.attendance.absent}</div>
                                <div className="text-gray-600">Afwezig</div>
                              </div>
                              <div>
                                <div className="text-xl font-bold text-orange-600">{report.attendance.late}</div>
                                <div className="text-gray-600">Te laat</div>
                              </div>
                              <div>
                                <div className="text-xl font-bold text-blue-600">{report.attendance.percentage}%</div>
                                <div className="text-gray-600">Aanwezigheid</div>
                              </div>
                            </div>
                          </div>

                          {/* Grades */}
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <h3 className="text-lg font-bold text-purple-800 mb-3">Cijfers per Vak</h3>
                            <div className="space-y-3">
                              {Object.entries(report.grades).map(([subject, grades]) => (
                                <div key={subject} className="bg-white p-3 rounded border">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-purple-700">{subject}</span>
                                    <span className="text-lg font-bold text-purple-600">{grades.average.toFixed(1)}</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-gray-600">
                                    <span>Tests: {grades.tests.length > 0 ? (grades.tests.reduce((sum, g) => sum + (g.score/g.maxScore)*10, 0) / grades.tests.length).toFixed(1) : 'Geen'}</span>
                                    <span>Taken: {grades.tasks.length > 0 ? (grades.tasks.reduce((sum, g) => sum + (g.score/g.maxScore)*10, 0) / grades.tasks.length).toFixed(1) : 'Geen'}</span>
                                    <span>Huiswerk: {grades.homework.length > 0 ? (grades.homework.reduce((sum, g) => sum + (g.score/g.maxScore)*10, 0) / grades.homework.length).toFixed(1) : 'Geen'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Behavior */}
                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <h3 className="text-lg font-bold text-yellow-800 mb-3">Gedrag</h3>
                            <div className="bg-white p-3 rounded border">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">Gedragscijfer:</span>
                                <span className="text-2xl font-bold text-yellow-600">{behaviorGrades[report.student.id]?.grade || 7}/10</span>
                              </div>
                              {behaviorGrades[report.student.id]?.comments && (
                                <div className="text-sm text-gray-700">
                                  <span className="font-semibold">Opmerkingen:</span> {behaviorGrades[report.student.id]?.comments}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* General Comments */}
                          {generalComments[report.student.id] && (
                            <div className="bg-green-50 p-4 rounded-lg">
                              <h3 className="text-lg font-bold text-green-800 mb-3">Algemene opmerkingen</h3>
                              <div className="bg-white p-3 rounded border text-sm text-gray-700">
                                {generalComments[report.student.id]}
                              </div>
                            </div>
                          )}

                          {/* Signatures */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Handtekeningen</h3>
                            <div className="grid grid-cols-2 gap-8">
                              <div>
                                <p className="text-sm font-semibold text-gray-700 mb-3">Handtekening ouder(s)/verzorger(s):</p>
                                <div className="border-b-2 border-gray-400 h-16 mb-2"></div>
                                <p className="text-xs text-gray-600">Datum: ________________</p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-700 mb-3">Handtekening klassenmentor:</p>
                                <div className="border-b-2 border-gray-400 h-16 mb-2"></div>
                                <p className="text-xs text-gray-600">Datum: ________________</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}