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
      orientation: 'portrait',
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
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 107, 169);
      pdf.text('RAPPORT', pageWidth - 20, 25, { align: 'right' });
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(64, 75, 105);
      pdf.text(`Schooljaar ${report.student.academicYear || '2024-2025'}`, pageWidth - 20, 35, { align: 'right' });

      yPos = 65;

      // Student info card with modern styling
      pdf.setFillColor(...warmGray);
      pdf.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'F');
      
      pdf.setDrawColor(...primaryBlue);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'D');

      // Student info with icons (represented as Unicode symbols)
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 107, 169);
      
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
      const colWidths = [50, 25, 25, 25, 45];
      
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

      // General Comments section on first page
      yPos += 30;
      
      pdf.setFillColor(233, 243, 250);
      pdf.roundedRect(20, yPos, pageWidth - 40, 80, 3, 3, 'F');
      pdf.setDrawColor(33, 107, 169);
      pdf.setLineWidth(1);
      pdf.roundedRect(20, yPos, pageWidth - 40, 80, 3, 3, 'D');
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 107, 169);
      pdf.text('💭 ALGEMENE OPMERKINGEN', 30, yPos + 20);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(64, 75, 105);
      
      if (generalComments[report.student.id]) {
        const commentLines = pdf.splitTextToSize(generalComments[report.student.id], pageWidth - 80);
        pdf.text(commentLines, 30, yPos + 40);
      } else {
        pdf.text('Leerling toont goede vooruitgang in alle aspecten van het onderwijs.', 30, yPos + 40);
      }

      // Footer with timestamp on first page
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Pagina 1 van 2 - Cijfers & Opmerkingen - Gegenereerd op ${new Date().toLocaleDateString('nl-NL')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Start new page for behavior and attendance
      pdf.addPage();
      yPos = 20;

      // Second page header
      pdf.setFillColor(233, 243, 250);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      // Top accent line
      pdf.setFillColor(33, 107, 169);
      pdf.rect(0, 0, pageWidth, 3, 'F');

      // Logo and title section for second page
      if (schoolLogo) {
        try {
          pdf.addImage(schoolLogo, 'JPEG', 20, 12, 40, 25);
        } catch (error) {
          console.warn('Could not add logo to PDF:', error);
        }
      }

      // Title for second page
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 107, 169);
      pdf.text('GEDRAG & AANWEZIGHEID', pageWidth - 20, 25, { align: 'right' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(64, 75, 105);
      pdf.text(`${report.student.firstName} ${report.student.lastName}`, pageWidth - 20, 35, { align: 'right' });

      yPos = 75;

      // Student info reminder on second page
      pdf.setFillColor(248, 249, 250);
      pdf.roundedRect(20, yPos, pageWidth - 40, 25, 3, 3, 'F');
      
      pdf.setDrawColor(33, 107, 169);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(20, yPos, pageWidth - 40, 25, 3, 3, 'D');

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 107, 169);
      pdf.text('👤 ' + `${report.student.firstName} ${report.student.lastName}`, 30, yPos + 10);
      pdf.text('🆔 ' + report.student.studentId, 30, yPos + 18);
      pdf.text('🏫 Klas 1A', pageWidth - 120, yPos + 10);
      pdf.text('📅 ' + new Date().toLocaleDateString('nl-NL'), pageWidth - 120, yPos + 18);

      yPos += 45;

      // Behavior section - optimized layout
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(20, yPos, pageWidth - 40, 120, 3, 3, 'F');
      pdf.setDrawColor(34, 139, 34);
      pdf.setLineWidth(1);
      pdf.roundedRect(20, yPos, pageWidth - 40, 120, 3, 3, 'D');
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(34, 139, 34);
      pdf.text('😊 GEDRAGSBEOORDELING', 30, yPos + 25);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(13);
      pdf.setTextColor(64, 75, 105);
      pdf.text(`Gedragscijfer: ${behaviorGrades[report.student.id]?.grade || 7}/10`, 30, yPos + 50);
      
      if (behaviorGrades[report.student.id]?.comments) {
        const behaviorComments = pdf.splitTextToSize(behaviorGrades[report.student.id]?.comments, pageWidth - 80);
        pdf.text(behaviorComments, 30, yPos + 70);
      } else {
        pdf.text('De leerling toont respectvol en positief gedrag tijdens alle lessen en activiteiten.', 30, yPos + 70);
        pdf.text('Samenwerking met medeleerlingen verloopt harmonieus en constructief.', 30, yPos + 85);
      }
      
      yPos += 140;
      
      // Attendance section - optimized layout
      pdf.setFillColor(240, 248, 255);
      pdf.roundedRect(20, yPos, pageWidth - 40, 100, 3, 3, 'F');
      pdf.setDrawColor(52, 152, 219);
      pdf.setLineWidth(1);
      pdf.roundedRect(20, yPos, pageWidth - 40, 100, 3, 3, 'D');
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(52, 152, 219);
      pdf.text('📅 AANWEZIGHEID', 30, yPos + 25);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(13);
      pdf.setTextColor(64, 75, 105);
      pdf.text(`❌ Aantal keer afwezig: ${report.attendance.absent} dagen`, 30, yPos + 50);
      pdf.text(`⏰ Aantal keer te laat: ${report.attendance.late} keer`, 30, yPos + 70);
      
      // Calculate attendance percentage
      const totalDays = 180; // Approximate school days
      const attendancePercentage = ((totalDays - report.attendance.absent) / totalDays * 100).toFixed(1);
      pdf.text(`📈 Aanwezigheidspercentage: ${attendancePercentage}%`, 30, yPos + 85);

      yPos += 120;

      // Final signature section on second page
      const finalSigWidth = (pageWidth - 60) / 2;
      
      // Parent signature card
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(20, yPos, finalSigWidth, 50, 3, 3, 'F');
      pdf.setDrawColor(52, 152, 219);
      pdf.setLineWidth(1);
      pdf.roundedRect(20, yPos, finalSigWidth, 50, 3, 3, 'D');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 107, 169);
      pdf.text('✍️ Handtekening ouders/verzorgers', 30, yPos + 20);
      
      pdf.setDrawColor(33, 107, 169);
      pdf.setLineWidth(1);
      pdf.line(30, yPos + 30, 30 + finalSigWidth - 20, yPos + 30);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Datum: _______________', 30, yPos + 42);
      
      // Teacher signature card
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(30 + finalSigWidth, yPos, finalSigWidth, 50, 3, 3, 'F');
      pdf.setDrawColor(52, 152, 219);
      pdf.setLineWidth(1);
      pdf.roundedRect(30 + finalSigWidth, yPos, finalSigWidth, 50, 3, 3, 'D');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 107, 169);
      pdf.text('👨‍🏫 Handtekening klassenmentor', 40 + finalSigWidth, yPos + 20);
      pdf.line(40 + finalSigWidth, yPos + 30, 40 + finalSigWidth + finalSigWidth - 20, yPos + 30);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Datum: _______________', 40 + finalSigWidth, yPos + 42);

      // Footer on second page
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Pagina 2 van 2`, pageWidth / 2, pageHeight - 10, { align: 'center' });
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
