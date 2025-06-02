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

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;

    reportData.forEach((report, index) => {
      if (index > 0) pdf.addPage();

      let yPos = 30;

      // Logo centered at top
      if (schoolLogo) {
        try {
          pdf.addImage(schoolLogo, 'JPEG', (pageWidth - 60) / 2, 15, 60, 30);
          yPos = 60;
        } catch (error) {
          console.warn('Could not add logo to PDF:', error);
        }
      }

      // Title "RAPPORT" centered
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('RAPPORT', pageWidth / 2, yPos, { align: 'center' });
      yPos += 30;

      // Student Information - simple layout like template
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Naam        : ${report.student.firstName} ${report.student.lastName}`, 30, yPos);
      yPos += 10;
      pdf.text(`StudentID   : ${report.student.studentId}`, 30, yPos);
      yPos += 10;
      pdf.text(`Klas        : 1A`, 30, yPos);
      yPos += 10;
      pdf.text(`Schooljaar  : ${report.student.academicYear || '2024-2025'}`, 30, yPos);
      yPos += 25;

      // Subjects Table Header
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      
      // Table dimensions - optimized for landscape A4 with better spacing
      const tableStartX = 20;
      const tableWidth = pageWidth - 40;
      const colWidths = [70, 30, 30, 30, 110]; // Auto-sizing: Vak, Testen, Taken, Examen, Opmerkingen
      
      // Header row with better formatting
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      
      let xPos = tableStartX;
      pdf.text('Vak', xPos + 4, yPos + 8);
      pdf.rect(xPos, yPos, colWidths[0], 15, 'D');
      xPos += colWidths[0];
      
      pdf.text('Testen', xPos + 8, yPos + 8);
      pdf.rect(xPos, yPos, colWidths[1], 15, 'D');
      xPos += colWidths[1];
      
      pdf.text('Taken', xPos + 8, yPos + 8);
      pdf.rect(xPos, yPos, colWidths[2], 15, 'D');
      xPos += colWidths[2];
      
      pdf.text('Examen', xPos + 6, yPos + 8);
      pdf.rect(xPos, yPos, colWidths[3], 15, 'D');
      xPos += colWidths[3];
      
      pdf.text('Opmerkingen', xPos + 5, yPos + 8);
      pdf.rect(xPos, yPos, colWidths[4], 15, 'D');
      
      yPos += 15;

      // Subject rows
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      Object.entries(report.grades).forEach(([subject, grades]) => {
        const testAvg = grades.tests.length > 0 ? (grades.tests.reduce((sum, g) => sum + (g.score/g.maxScore)*10, 0) / grades.tests.length).toFixed(1) : '-';
        const taskAvg = grades.tasks.length > 0 ? (grades.tasks.reduce((sum, g) => sum + (g.score/g.maxScore)*10, 0) / grades.tasks.length).toFixed(1) : '-';
        const examAvg = testAvg; // Using test average for exam (can be adjusted)
        
        xPos = tableStartX;
        
        // Subject name
        pdf.text(subject, xPos + 3, yPos + 8);
        pdf.rect(xPos, yPos, colWidths[0], 15, 'D');
        xPos += colWidths[0];
        
        // Tests
        pdf.text(testAvg, xPos + 12, yPos + 8, { align: 'center' });
        pdf.rect(xPos, yPos, colWidths[1], 15, 'D');
        xPos += colWidths[1];
        
        // Tasks
        pdf.text(taskAvg, xPos + 12, yPos + 8, { align: 'center' });
        pdf.rect(xPos, yPos, colWidths[2], 15, 'D');
        xPos += colWidths[2];
        
        // Exam
        pdf.text(examAvg, xPos + 12, yPos + 8, { align: 'center' });
        pdf.rect(xPos, yPos, colWidths[3], 15, 'D');
        xPos += colWidths[3];
        
        // Comments
        pdf.text('Goede vooruitgang', xPos + 3, yPos + 8);
        pdf.rect(xPos, yPos, colWidths[4], 15, 'D');
        
        yPos += 15;
      });

      // Add empty rows to match template
      for (let i = 0; i < 3; i++) {
        xPos = tableStartX;
        for (let j = 0; j < colWidths.length; j++) {
          pdf.rect(xPos, yPos, colWidths[j], 15, 'D');
          xPos += colWidths[j];
        }
        yPos += 15;
      }

      yPos += 20;

      // General Comments Section
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Algemene opmerkingen:', 30, yPos);
      yPos += 10;

      // Comments box
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const commentsHeight = 40;
      pdf.rect(30, yPos, tableWidth, commentsHeight, 'D');
      
      if (generalComments[report.student.id]) {
        const commentLines = pdf.splitTextToSize(generalComments[report.student.id], tableWidth - 10);
        pdf.text(commentLines, 35, yPos + 10);
      }
      
      yPos += commentsHeight + 30;

      // Signature section - exactly like template
      const sigLineLength = 70;
      const sigSpacing = (pageWidth - 60 - (2 * sigLineLength)) / 3;
      
      // Parent signature
      pdf.line(30, yPos, 30 + sigLineLength, yPos);
      pdf.text('Handtekening ouders', 30 + (sigLineLength / 2), yPos + 10, { align: 'center' });
      
      // Teacher signature
      const teacherSigStart = 30 + sigLineLength + sigSpacing;
      pdf.line(teacherSigStart, yPos, teacherSigStart + sigLineLength, yPos);
      pdf.text('Handtekening leraar', teacherSigStart + (sigLineLength / 2), yPos + 10, { align: 'center' });

      // Start new page for behavior and attendance if needed
      if (yPos > pageHeight - 150) {
        pdf.addPage();
        yPos = 30;
      } else {
        yPos += 40;
      }

      // Second section header
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('GEDRAG & AANWEZIGHEID', pageWidth / 2, yPos, { align: 'center' });
      yPos += 30;

      // Behavior section
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('GEDRAG', 30, yPos);
      yPos += 15;

      const behaviorBoxHeight = 60;
      pdf.rect(30, yPos, tableWidth, behaviorBoxHeight, 'D');
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.text(`Gedragscijfer: ${behaviorGrades[report.student.id]?.grade || 7}/10`, 35, yPos + 15);
      
      if (behaviorGrades[report.student.id]?.comments) {
        const behaviorComments = pdf.splitTextToSize(behaviorGrades[report.student.id]?.comments, tableWidth - 10);
        pdf.text(behaviorComments, 35, yPos + 30);
      }
      
      yPos += behaviorBoxHeight + 20;

      // Attendance section
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AANWEZIGHEID', 30, yPos);
      yPos += 15;

      const attendanceBoxHeight = 60;
      pdf.rect(30, yPos, tableWidth, attendanceBoxHeight, 'D');
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.text(`Aantal keer afwezig: ${report.attendance.absent}`, 35, yPos + 15);
      pdf.text(`Aantal keer te laat: ${report.attendance.late}`, 35, yPos + 30);
      pdf.text('Opmerkingen: Goede aanwezigheid getoond', 35, yPos + 45);
      
      yPos += attendanceBoxHeight + 40;

      // Bottom signatures
      pdf.line(30, yPos, 30 + sigLineLength, yPos);
      pdf.text('Handtekening ouders', 30 + (sigLineLength / 2), yPos + 10, { align: 'center' });
      
      pdf.line(teacherSigStart, yPos, teacherSigStart + sigLineLength, yPos);
      pdf.text('Handtekening leraar', teacherSigStart + (sigLineLength / 2), yPos + 10, { align: 'center' });
    });

    // Save PDF
    const className = selectedReportType === 'class' ? classesData?.find((c: StudentGroup) => c.id.toString() === selectedClass)?.name : '';
    const studentName = selectedReportType === 'individual' ? reportData[0]?.student.firstName + '_' + reportData[0]?.student.lastName : '';
    const filename = `rapport_${className || studentName}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    pdf.save(filename);

    toast({
      title: "Rapport gegenereerd",
      description: `Rapport gebaseerd op template opgeslagen als ${filename}`,
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
                      {/* PDF Preview - Professional landscape A4 format */}
                      <div className="bg-white min-h-[600px] w-full mx-auto shadow-lg border border-gray-200 p-8 font-sans text-sm" style={{ aspectRatio: '297/210' }}>
                        {/* Header with logo and title */}
                        <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
                          {schoolLogo ? (
                            <img src={schoolLogo} alt="School logo" className="h-16 w-auto mx-auto mb-4" />
                          ) : (
                            <div className="h-16 w-24 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center text-blue-600 text-xs mb-4 border border-blue-200">
                              <span>Logo uploaden</span>
                            </div>
                          )}
                          <h1 className="text-3xl font-bold text-gray-800 tracking-wide">RAPPORT</h1>
                        </div>

                        {/* Student Info - Clean card layout */}
                        <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <span className="font-semibold text-gray-700 w-24">Naam:</span>
                                <span className="text-gray-900">{report.student.firstName} {report.student.lastName}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-semibold text-gray-700 w-24">StudentID:</span>
                                <span className="text-gray-900">{report.student.studentId}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <span className="font-semibold text-gray-700 w-24">Klas:</span>
                                <span className="text-gray-900">1A</span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-semibold text-gray-700 w-24">Schooljaar:</span>
                                <span className="text-gray-900">{report.student.academicYear || '2024-2025'}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Grades Table - Modern professional design */}
                        <div className="mb-8">
                          <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                            <thead>
                              <tr className="bg-gray-100 border-b border-gray-300">
                                <th className="border-r border-gray-300 p-3 text-left font-bold text-gray-800" style={{ width: '30%' }}>Vak</th>
                                <th className="border-r border-gray-300 p-3 text-center font-bold text-gray-800" style={{ width: '15%' }}>Testen</th>
                                <th className="border-r border-gray-300 p-3 text-center font-bold text-gray-800" style={{ width: '15%' }}>Taken</th>
                                <th className="border-r border-gray-300 p-3 text-center font-bold text-gray-800" style={{ width: '15%' }}>Examen</th>
                                <th className="p-3 text-left font-bold text-gray-800" style={{ width: '25%' }}>Opmerkingen</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(report.grades).map(([subject, grades], index) => {
                                const testAvg = grades.tests.length > 0 ? (grades.tests.reduce((sum, g) => sum + (g.score/g.maxScore)*10, 0) / grades.tests.length).toFixed(1) : '-';
                                const taskAvg = grades.tasks.length > 0 ? (grades.tasks.reduce((sum, g) => sum + (g.score/g.maxScore)*10, 0) / grades.tasks.length).toFixed(1) : '-';
                                const isEven = index % 2 === 0;
                                
                                return (
                                  <tr key={subject} className={`border-b border-gray-200 h-12 ${isEven ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                                    <td className="border-r border-gray-200 p-3 font-medium text-gray-800">{subject}</td>
                                    <td className="border-r border-gray-200 p-3 text-center">
                                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                        parseFloat(testAvg) >= 6.5 ? 'bg-green-100 text-green-800' : 
                                        parseFloat(testAvg) >= 5.5 ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {testAvg}
                                      </span>
                                    </td>
                                    <td className="border-r border-gray-200 p-3 text-center">
                                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                        parseFloat(taskAvg) >= 6.5 ? 'bg-green-100 text-green-800' : 
                                        parseFloat(taskAvg) >= 5.5 ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {taskAvg}
                                      </span>
                                    </td>
                                    <td className="border-r border-gray-200 p-3 text-center">
                                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                        parseFloat(testAvg) >= 6.5 ? 'bg-green-100 text-green-800' : 
                                        parseFloat(testAvg) >= 5.5 ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {testAvg}
                                      </span>
                                    </td>
                                    <td className="p-3 text-gray-700 text-sm">Uitstekende vooruitgang getoond</td>
                                  </tr>
                                );
                              })}
                              {/* Empty rows with subtle styling */}
                              {Array.from({ length: 2 }).map((_, i) => (
                                <tr key={`empty-${i}`} className="border-b border-gray-200 h-12 bg-gray-25">
                                  <td className="border-r border-gray-200 p-3"></td>
                                  <td className="border-r border-gray-200 p-3"></td>
                                  <td className="border-r border-gray-200 p-3"></td>
                                  <td className="border-r border-gray-200 p-3"></td>
                                  <td className="p-3"></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Layout for remaining sections */}
                        <div className="grid grid-cols-2 gap-8">
                          {/* Left column - Comments and signatures */}
                          <div className="space-y-6">
                            {/* General Comments */}
                            <div>
                              <h3 className="font-bold mb-3 text-gray-800 text-lg">Algemene opmerkingen</h3>
                              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[80px]">
                                {generalComments[report.student.id] ? (
                                  <div className="text-gray-700 text-sm leading-relaxed">
                                    {generalComments[report.student.id]}
                                  </div>
                                ) : (
                                  <div className="text-gray-400 text-sm italic">Geen opmerkingen toegevoegd</div>
                                )}
                              </div>
                            </div>

                            {/* Signatures */}
                            <div className="space-y-4">
                              <div className="text-center">
                                <div className="border-b-2 border-gray-400 h-12 mb-2"></div>
                                <div className="text-sm font-medium text-gray-700">Handtekening ouders/verzorgers</div>
                              </div>
                              <div className="text-center">
                                <div className="border-b-2 border-gray-400 h-12 mb-2"></div>
                                <div className="text-sm font-medium text-gray-700">Handtekening klassenmentor</div>
                              </div>
                            </div>
                          </div>

                          {/* Right column - Behavior and Attendance */}
                          <div className="space-y-6">
                            {/* Behavior section */}
                            <div>
                              <h3 className="font-bold mb-3 text-gray-800 text-lg">Gedrag</h3>
                              <div className="border border-gray-300 rounded-lg p-4 bg-gradient-to-br from-green-50 to-green-100">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-gray-700 font-medium">Gedragscijfer:</span>
                                  <span className="text-2xl font-bold text-green-600">{behaviorGrades[report.student.id]?.grade || 7}/10</span>
                                </div>
                                {behaviorGrades[report.student.id]?.comments && (
                                  <div className="text-gray-600 text-sm">
                                    {behaviorGrades[report.student.id]?.comments}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Attendance section */}
                            <div>
                              <h3 className="font-bold mb-3 text-gray-800 text-lg">Aanwezigheid</h3>
                              <div className="border border-gray-300 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-blue-100">
                                <div className="grid grid-cols-2 gap-4 mb-2">
                                  <div className="text-center">
                                    <div className="text-sm text-gray-600">Afwezig</div>
                                    <div className="text-xl font-bold text-red-600">{report.attendance.absent}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-sm text-gray-600">Te laat</div>
                                    <div className="text-xl font-bold text-orange-600">{report.attendance.late}</div>
                                  </div>
                                </div>
                                <div className="text-gray-600 text-sm">
                                  Uitstekende aanwezigheid en punctualiteit
                                </div>
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