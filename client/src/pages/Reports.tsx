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

    // Madrassa app kleuren
    const primaryBlue = [33, 107, 169];
    const accentBlue = [52, 152, 219];
    const lightBlue = [233, 243, 250];
    const warmGray = [248, 249, 250];
    const darkGray = [64, 75, 105];
    const successGreen = [34, 139, 34];
    const warningOrange = [255, 152, 0];
    const dangerRed = [220, 53, 69];

    reportData.forEach((report, index) => {
      if (index > 0) pdf.addPage();

      let yPos = 20;

      // Modern header with gradient-like effect
      pdf.setFillColor(...lightBlue);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      // Top accent line
      pdf.setFillColor(...primaryBlue);
      pdf.rect(0, 0, pageWidth, 3, 'F');

      // Logo and title section
      if (schoolLogo) {
        try {
          pdf.addImage(schoolLogo, 'JPEG', 20, 12, 40, 25);
        } catch (error) {
          console.warn('Could not add logo to PDF:', error);
        }
      }

      // School name and title with modern typography
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryBlue);
      pdf.text('RAPPORT', pageWidth - 20, 25, { align: 'right' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...darkGray);
      pdf.text(`Schooljaar ${report.student.academicYear || '2024-2025'}`, pageWidth - 20, 35, { align: 'right' });

      yPos = 65;

      // Student info card with modern styling
      pdf.setFillColor(...warmGray);
      pdf.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'F');
      
      pdf.setDrawColor(...primaryBlue);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'D');

      // Student info with icons (represented as Unicode symbols)
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryBlue);
      
      // Left column
      pdf.text('👤 ' + `${report.student.firstName} ${report.student.lastName}`, 30, yPos + 12);
      pdf.text('🆔 ' + report.student.studentId, 30, yPos + 22);
      
      // Right column
      pdf.text('🏫 Klas 1A', pageWidth - 120, yPos + 12);
      pdf.text('📅 ' + new Date().toLocaleDateString('nl-NL'), pageWidth - 120, yPos + 22);

      yPos += 50;

      // Modern table with rounded corners and better colors
      const tableStartX = 20;
      const tableWidth = pageWidth - 40;
      const colWidths = [70, 35, 35, 35, 95];
      
      // Table header with gradient effect
      pdf.setFillColor(...primaryBlue);
      pdf.roundedRect(tableStartX, yPos, tableWidth, 18, 2, 2, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      
      let xPos = tableStartX;
      pdf.text('📚 Vak', xPos + 5, yPos + 12);
      xPos += colWidths[0];
      pdf.text('📝 Testen', xPos + 8, yPos + 12);
      xPos += colWidths[1];
      pdf.text('📋 Taken', xPos + 8, yPos + 12);
      xPos += colWidths[2];
      pdf.text('🎯 Examen', xPos + 6, yPos + 12);
      xPos += colWidths[3];
      pdf.text('💬 Opmerkingen', xPos + 5, yPos + 12);
      
      yPos += 18;

      // Subject rows with alternating colors and modern styling
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      
      Object.entries(report.grades).forEach(([subject, grades], rowIndex) => {
        const testAvg = grades.tests.length > 0 ? (grades.tests.reduce((sum, g) => sum + (g.score/g.maxScore)*10, 0) / grades.tests.length).toFixed(1) : '-';
        const taskAvg = grades.tasks.length > 0 ? (grades.tasks.reduce((sum, g) => sum + (g.score/g.maxScore)*10, 0) / grades.tasks.length).toFixed(1) : '-';
        
        // Alternating row colors
        if (rowIndex % 2 === 0) {
          pdf.setFillColor(250, 251, 252);
          pdf.rect(tableStartX, yPos, tableWidth, 15, 'F');
        }
        
        // Row border
        pdf.setDrawColor(220, 226, 235);
        pdf.setLineWidth(0.3);
        pdf.rect(tableStartX, yPos, tableWidth, 15, 'D');

        pdf.setTextColor(...darkGray);
        xPos = tableStartX;
        
        // Subject name
        pdf.text(subject, xPos + 5, yPos + 10);
        xPos += colWidths[0];
        
        // Grade with color coding
        const testScore = parseFloat(testAvg);
        if (testAvg !== '-') {
          if (testScore >= 6.5) pdf.setTextColor(...successGreen);
          else if (testScore >= 5.5) pdf.setTextColor(...warningOrange);
          else pdf.setTextColor(...dangerRed);
        } else {
          pdf.setTextColor(...darkGray);
        }
        pdf.text(testAvg, xPos + 15, yPos + 10, { align: 'center' });
        xPos += colWidths[1];
        
        // Task grade
        const taskScore = parseFloat(taskAvg);
        if (taskAvg !== '-') {
          if (taskScore >= 6.5) pdf.setTextColor(...successGreen);
          else if (taskScore >= 5.5) pdf.setTextColor(...warningOrange);
          else pdf.setTextColor(...dangerRed);
        } else {
          pdf.setTextColor(...darkGray);
        }
        pdf.text(taskAvg, xPos + 15, yPos + 10, { align: 'center' });
        xPos += colWidths[2];
        
        // Exam grade
        pdf.text(testAvg, xPos + 15, yPos + 10, { align: 'center' });
        xPos += colWidths[3];
        
        // Comments
        pdf.setTextColor(...darkGray);
        pdf.text('Uitstekende vooruitgang getoond', xPos + 5, yPos + 10);
        
        yPos += 15;
      });

      // Add styled empty rows
      for (let i = 0; i < 2; i++) {
        if (i % 2 === 0) {
          pdf.setFillColor(250, 251, 252);
          pdf.rect(tableStartX, yPos, tableWidth, 15, 'F');
        }
        pdf.setDrawColor(220, 226, 235);
        pdf.rect(tableStartX, yPos, tableWidth, 15, 'D');
        yPos += 15;
      }

      yPos += 20;

      // Modern comment section
      pdf.setFillColor(...lightBlue);
      pdf.roundedRect(20, yPos, tableWidth, 50, 3, 3, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryBlue);
      pdf.text('💭 Algemene opmerkingen', 30, yPos + 15);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(...darkGray);
      
      if (generalComments[report.student.id]) {
        const commentLines = pdf.splitTextToSize(generalComments[report.student.id], tableWidth - 20);
        pdf.text(commentLines, 30, yPos + 28);
      } else {
        pdf.text('Leerling toont goede vooruitgang in alle aspecten.', 30, yPos + 28);
      }
      
      yPos += 70;

      // Modern signature section
      const cardWidth = (pageWidth - 60) / 2;
      
      // Parent signature card
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(20, yPos, cardWidth, 40, 3, 3, 'F');
      pdf.setDrawColor(...accentBlue);
      pdf.setLineWidth(1);
      pdf.roundedRect(20, yPos, cardWidth, 40, 3, 3, 'D');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryBlue);
      pdf.text('✍️ Handtekening ouders/verzorgers', 30, yPos + 15);
      
      pdf.setDrawColor(...primaryBlue);
      pdf.setLineWidth(1);
      pdf.line(30, yPos + 25, 30 + cardWidth - 20, yPos + 25);
      
      // Teacher signature card
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(30 + cardWidth, yPos, cardWidth, 40, 3, 3, 'F');
      pdf.setDrawColor(...accentBlue);
      pdf.setLineWidth(1);
      pdf.roundedRect(30 + cardWidth, yPos, cardWidth, 40, 3, 3, 'D');
      
      pdf.text('👨‍🏫 Handtekening klassenmentor', 40 + cardWidth, yPos + 15);
      pdf.line(40 + cardWidth, yPos + 25, 40 + cardWidth + cardWidth - 20, yPos + 25);

      yPos += 60;

      // Second page sections side by side
      const sectionWidth = (pageWidth - 60) / 2;
      
      // Behavior section
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(20, yPos, sectionWidth, 60, 3, 3, 'F');
      pdf.setDrawColor(...successGreen);
      pdf.setLineWidth(1);
      pdf.roundedRect(20, yPos, sectionWidth, 60, 3, 3, 'D');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...successGreen);
      pdf.text('😊 GEDRAG', 30, yPos + 15);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(...darkGray);
      pdf.text(`Gedragscijfer: ${behaviorGrades[report.student.id]?.grade || 7}/10`, 30, yPos + 30);
      
      if (behaviorGrades[report.student.id]?.comments) {
        const behaviorComments = pdf.splitTextToSize(behaviorGrades[report.student.id]?.comments, sectionWidth - 20);
        pdf.text(behaviorComments, 30, yPos + 42);
      }
      
      // Attendance section
      pdf.setFillColor(240, 248, 255);
      pdf.roundedRect(30 + sectionWidth, yPos, sectionWidth, 60, 3, 3, 'F');
      pdf.setDrawColor(...accentBlue);
      pdf.setLineWidth(1);
      pdf.roundedRect(30 + sectionWidth, yPos, sectionWidth, 60, 3, 3, 'D');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...accentBlue);
      pdf.text('📅 AANWEZIGHEID', 40 + sectionWidth, yPos + 15);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(...darkGray);
      pdf.text(`❌ Afwezig: ${report.attendance.absent} keer`, 40 + sectionWidth, yPos + 30);
      pdf.text(`⏰ Te laat: ${report.attendance.late} keer`, 40 + sectionWidth, yPos + 42);
      pdf.text('📈 Uitstekende aanwezigheid', 40 + sectionWidth, yPos + 54);

      // Footer with timestamp
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Gegenereerd op ${new Date().toLocaleDateString('nl-NL')} om ${new Date().toLocaleTimeString('nl-NL')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    });

    // Save PDF
    const className = selectedReportType === 'class' ? classesData?.find((c: StudentGroup) => c.id.toString() === selectedClass)?.name : '';
    const studentName = selectedReportType === 'individual' ? reportData[0]?.student.firstName + '_' + reportData[0]?.student.lastName : '';
    const filename = `moderne_rapport_${className || studentName}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    pdf.save(filename);

    toast({
      title: "Modern rapport gegenereerd",
      description: `Professioneel rapport met Madrassa styling opgeslagen als ${filename}`,
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
                      {/* PDF Preview - Modern Madrassa styling */}
                      <div className="bg-white min-h-[600px] w-full mx-auto shadow-xl border border-blue-100 p-6 font-sans text-sm rounded-lg" style={{ aspectRatio: '297/210' }}>
                        {/* Modern header with Madrassa colors */}
                        <div className="relative mb-6">
                          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg p-4 -m-6 mb-6">
                            <div className="h-1 bg-blue-400 rounded mb-4"></div>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center space-x-4">
                                {schoolLogo ? (
                                  <img src={schoolLogo} alt="School logo" className="h-12 w-auto" />
                                ) : (
                                  <div className="h-12 w-16 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center text-white text-xs border border-white/30">
                                    <span>📚 Logo</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <h1 className="text-2xl font-bold text-white tracking-wide">RAPPORT</h1>
                                <p className="text-blue-100 text-sm">{report.student.academicYear || '2024-2025'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Student Info - Modern card with icons */}
                        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                          <div className="grid grid-cols-2 gap-6 text-sm">
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <span className="text-blue-600">👤</span>
                                <span className="font-semibold text-blue-800">Naam:</span>
                                <span className="text-gray-800">{report.student.firstName} {report.student.lastName}</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-blue-600">🆔</span>
                                <span className="font-semibold text-blue-800">StudentID:</span>
                                <span className="text-gray-800">{report.student.studentId}</span>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <span className="text-blue-600">🏫</span>
                                <span className="font-semibold text-blue-800">Klas:</span>
                                <span className="text-gray-800">1A</span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-blue-600">📅</span>
                                <span className="font-semibold text-blue-800">Datum:</span>
                                <span className="text-gray-800">{new Date().toLocaleDateString('nl-NL')}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Grades Table - Modern design with icons */}
                        <div className="mb-6">
                          <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-md border border-blue-100">
                            <thead>
                              <tr className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                                <th className="border-r border-blue-500 p-2 text-left font-semibold text-sm" style={{ width: '28%' }}>
                                  <span className="flex items-center space-x-2">
                                    <span>📚</span>
                                    <span>Vak</span>
                                  </span>
                                </th>
                                <th className="border-r border-blue-500 p-2 text-center font-semibold text-sm" style={{ width: '18%' }}>
                                  <span className="flex items-center justify-center space-x-1">
                                    <span>📝</span>
                                    <span>Testen</span>
                                  </span>
                                </th>
                                <th className="border-r border-blue-500 p-2 text-center font-semibold text-sm" style={{ width: '18%' }}>
                                  <span className="flex items-center justify-center space-x-1">
                                    <span>📋</span>
                                    <span>Taken</span>
                                  </span>
                                </th>
                                <th className="border-r border-blue-500 p-2 text-center font-semibold text-sm" style={{ width: '18%' }}>
                                  <span className="flex items-center justify-center space-x-1">
                                    <span>🎯</span>
                                    <span>Examen</span>
                                  </span>
                                </th>
                                <th className="p-2 text-left font-semibold text-sm" style={{ width: '18%' }}>
                                  <span className="flex items-center space-x-2">
                                    <span>💬</span>
                                    <span>Opmerkingen</span>
                                  </span>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(report.grades).map(([subject, grades], index) => {
                                const testAvg = grades.tests.length > 0 ? (grades.tests.reduce((sum, g) => sum + (g.score/g.maxScore)*10, 0) / grades.tests.length).toFixed(1) : '-';
                                const taskAvg = grades.tasks.length > 0 ? (grades.tasks.reduce((sum, g) => sum + (g.score/g.maxScore)*10, 0) / grades.tasks.length).toFixed(1) : '-';
                                const isEven = index % 2 === 0;
                                
                                return (
                                  <tr key={subject} className={`border-b border-blue-100 h-10 ${isEven ? 'bg-blue-25' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                                    <td className="border-r border-blue-100 p-2 font-medium text-gray-800 text-sm">{subject}</td>
                                    <td className="border-r border-blue-100 p-2 text-center">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold min-w-[40px] justify-center ${
                                        parseFloat(testAvg) >= 6.5 ? 'bg-green-100 text-green-700 border border-green-200' : 
                                        parseFloat(testAvg) >= 5.5 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                                        parseFloat(testAvg) < 5.5 && testAvg !== '-' ? 'bg-red-100 text-red-700 border border-red-200' :
                                        'bg-gray-100 text-gray-500 border border-gray-200'
                                      }`}>
                                        {testAvg}
                                      </span>
                                    </td>
                                    <td className="border-r border-blue-100 p-2 text-center">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold min-w-[40px] justify-center ${
                                        parseFloat(taskAvg) >= 6.5 ? 'bg-green-100 text-green-700 border border-green-200' : 
                                        parseFloat(taskAvg) >= 5.5 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                                        parseFloat(taskAvg) < 5.5 && taskAvg !== '-' ? 'bg-red-100 text-red-700 border border-red-200' :
                                        'bg-gray-100 text-gray-500 border border-gray-200'
                                      }`}>
                                        {taskAvg}
                                      </span>
                                    </td>
                                    <td className="border-r border-blue-100 p-2 text-center">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold min-w-[40px] justify-center ${
                                        parseFloat(testAvg) >= 6.5 ? 'bg-green-100 text-green-700 border border-green-200' : 
                                        parseFloat(testAvg) >= 5.5 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                                        parseFloat(testAvg) < 5.5 && testAvg !== '-' ? 'bg-red-100 text-red-700 border border-red-200' :
                                        'bg-gray-100 text-gray-500 border border-gray-200'
                                      }`}>
                                        {testAvg}
                                      </span>
                                    </td>
                                    <td className="p-2 text-gray-600 text-xs">Goede vooruitgang</td>
                                  </tr>
                                );
                              })}
                              {/* Empty rows with subtle styling */}
                              {Array.from({ length: 1 }).map((_, i) => (
                                <tr key={`empty-${i}`} className="border-b border-blue-100 h-10 bg-blue-25">
                                  <td className="border-r border-blue-100 p-2"></td>
                                  <td className="border-r border-blue-100 p-2"></td>
                                  <td className="border-r border-blue-100 p-2"></td>
                                  <td className="border-r border-blue-100 p-2"></td>
                                  <td className="p-2"></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Modern layout for remaining sections */}
                        <div className="grid grid-cols-2 gap-6">
                          {/* Left column - Comments and signatures */}
                          <div className="space-y-4">
                            {/* General Comments */}
                            <div>
                              <h3 className="flex items-center space-x-2 font-bold mb-2 text-blue-800 text-sm">
                                <span>💭</span>
                                <span>Algemene opmerkingen</span>
                              </h3>
                              <div className="border border-blue-200 rounded-lg p-3 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-[60px]">
                                {generalComments[report.student.id] ? (
                                  <div className="text-gray-700 text-xs leading-relaxed">
                                    {generalComments[report.student.id]}
                                  </div>
                                ) : (
                                  <div className="text-blue-400 text-xs italic">Leerling toont goede vooruitgang</div>
                                )}
                              </div>
                            </div>

                            {/* Signatures */}
                            <div className="space-y-3">
                              <div className="bg-white border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span>✍️</span>
                                  <span className="text-xs font-medium text-blue-700">Handtekening ouders</span>
                                </div>
                                <div className="border-b-2 border-blue-300 h-6 mb-1"></div>
                              </div>
                              <div className="bg-white border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span>👨‍🏫</span>
                                  <span className="text-xs font-medium text-blue-700">Handtekening mentor</span>
                                </div>
                                <div className="border-b-2 border-blue-300 h-6 mb-1"></div>
                              </div>
                            </div>
                          </div>

                          {/* Right column - Behavior and Attendance */}
                          <div className="space-y-4">
                            {/* Behavior section */}
                            <div>
                              <h3 className="flex items-center space-x-2 font-bold mb-2 text-green-700 text-sm">
                                <span>😊</span>
                                <span>Gedrag</span>
                              </h3>
                              <div className="border border-green-200 rounded-lg p-3 bg-gradient-to-br from-green-50 to-emerald-50">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-green-700 font-medium text-xs">Gedragscijfer:</span>
                                  <span className="text-lg font-bold text-green-600">{behaviorGrades[report.student.id]?.grade || 7}/10</span>
                                </div>
                                {behaviorGrades[report.student.id]?.comments && (
                                  <div className="text-green-600 text-xs">
                                    {behaviorGrades[report.student.id]?.comments}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Attendance section */}
                            <div>
                              <h3 className="flex items-center space-x-2 font-bold mb-2 text-blue-700 text-sm">
                                <span>📅</span>
                                <span>Aanwezigheid</span>
                              </h3>
                              <div className="border border-blue-200 rounded-lg p-3 bg-gradient-to-br from-blue-50 to-cyan-50">
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                  <div className="text-center">
                                    <div className="flex items-center justify-center space-x-1 mb-1">
                                      <span>❌</span>
                                      <span className="text-xs text-red-600">Afwezig</span>
                                    </div>
                                    <div className="text-lg font-bold text-red-600">{report.attendance.absent}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="flex items-center justify-center space-x-1 mb-1">
                                      <span>⏰</span>
                                      <span className="text-xs text-orange-600">Te laat</span>
                                    </div>
                                    <div className="text-lg font-bold text-orange-600">{report.attendance.late}</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span>📈</span>
                                  <span className="text-blue-600 text-xs">Goede aanwezigheid</span>
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