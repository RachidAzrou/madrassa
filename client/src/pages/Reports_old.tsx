import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { FileDown, Upload, Users, User, FileText } from 'lucide-react';
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
  const [selectedReportType, setSelectedReportType] = useState<'class' | 'individual'>('class');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('myMadrassa');
  const [generalComments, setGeneralComments] = useState<{[key: number]: string}>({});
  const [behaviorGrades, setBehaviorGrades] = useState<{[key: number]: BehaviorGrade}>({});
  const [attendanceComments, setAttendanceComments] = useState<{[key: number]: string}>({});
  const [reportPreview, setReportPreview] = useState<ReportData[]>([]);

  // Fetch classes
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

  // Generate preview data without PDF
  const generatePreviewData = async () => {
    try {
      let targetStudents: Student[] = [];

      if (selectedReportType === 'class' && selectedClass) {
        const classResponse = await fetch(`/api/students/class/${selectedClass}`);
        if (!classResponse.ok) throw new Error('Failed to fetch class students');
        targetStudents = await classResponse.json();
      } else if (selectedReportType === 'individual' && selectedStudent) {
        const student = studentsData?.find((s: Student) => s.id.toString() === selectedStudent);
        if (student) targetStudents = [student];
      }

      const reports: ReportData[] = [];

      for (const student of targetStudents) {
        const attendanceResponse = await fetch(`/api/attendance/student/${student.id}`);
        const attendanceData: AttendanceRecord[] = attendanceResponse.ok ? await attendanceResponse.json() : [];

        const total = attendanceData.length;
        const present = attendanceData.filter(a => a.status === 'present').length;
        const absent = attendanceData.filter(a => a.status === 'absent').length;
        const late = attendanceData.filter(a => a.status === 'late').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        const gradesResponse = await fetch(`/api/grades/student/${student.id}`);
        const gradesData: Grade[] = gradesResponse.ok ? await gradesResponse.json() : [];

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

        Object.keys(gradesBySubject).forEach(subject => {
          const subjectGrades = gradesBySubject[subject];
          const allGrades = [...subjectGrades.tests, ...subjectGrades.tasks, ...subjectGrades.homework];
          if (allGrades.length > 0) {
            const weightedSum = allGrades.reduce((sum, grade) => sum + (grade.score / grade.maxScore) * 10 * grade.weight, 0);
            const totalWeight = allGrades.reduce((sum, grade) => sum + grade.weight, 0);
            subjectGrades.average = totalWeight > 0 ? weightedSum / totalWeight : 0;
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

      console.log('Generated reports:', reports);
      setReportPreview(reports);
    } catch (error) {
      console.error('Error generating preview data:', error);
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
        // Fetch attendance data using the working endpoint
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
            subjectGrades.average = totalWeight > 0 ? weightedSum / totalWeight : 0;
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

      generatePDF(reports);
    } catch (error) {
      console.error('Error generating report data:', error);
    }
  };

  const generatePDF = (reportData: ReportData[]) => {
    if (reportData.length === 0) {
      alert('Geen gegevens beschikbaar voor rapportage');
      return;
    }

    // Create PDF with portrait orientation
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;

    reportData.forEach((report, index) => {
      if (index > 0) pdf.addPage();

      let yPos = 20;

      // Modern header with gradient-like effect
      pdf.setFillColor(233, 243, 250);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      // Top accent line
      pdf.setFillColor(33, 107, 169);
      pdf.rect(0, 0, pageWidth, 3, 'F');

      // School name as title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 107, 169);
      pdf.text(schoolName, 20, 25);
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 107, 169);
      pdf.text('SCHOOLRAPPORT', pageWidth - 20, 25, { align: 'right' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(64, 75, 105);
      pdf.text(`Schooljaar ${report.student.academicYear || '2024-2025'}`, pageWidth - 20, 35, { align: 'right' });

      yPos = 65;

      // Student info card with modern styling
      pdf.setFillColor(248, 249, 250);
      pdf.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'F');
      
      pdf.setDrawColor(33, 107, 169);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'D');

      // Student info with clean labels - better organized
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 107, 169);
      
      // First row
      pdf.text(`Leerling: ${report.student.firstName} ${report.student.lastName}`, 30, yPos + 15);
      pdf.text('Klas: 1A', pageWidth - 80, yPos + 15);
      
      // Second row  
      pdf.text(`Leerlingnummer: ${report.student.studentId}`, 30, yPos + 25);
      pdf.text(`Datum: ${new Date().toLocaleDateString('nl-NL')}`, pageWidth - 80, yPos + 25);

      yPos += 50;

      // Modern table with optimized column widths for portrait
      const tableStartX = 20;
      const tableWidth = pageWidth - 40;
      const colWidths = [60, 30, 30, 30, 20];
      
      // Table header with gradient effect
      pdf.setFillColor(33, 107, 169);
      pdf.roundedRect(tableStartX, yPos, tableWidth, 18, 2, 2, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      
      let xPos = tableStartX;
      pdf.text('VAK', xPos + 5, yPos + 12);
      xPos += colWidths[0];
      pdf.text('TESTEN', xPos + 3, yPos + 12);
      xPos += colWidths[1];
      pdf.text('TAKEN', xPos + 3, yPos + 12);
      xPos += colWidths[2];
      pdf.text('EXAMEN', xPos + 3, yPos + 12);
      xPos += colWidths[3];
      pdf.text('BEORD.', xPos + 2, yPos + 12);
      
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

        pdf.setTextColor(64, 75, 105);
        xPos = tableStartX;
        
        // Subject name
        pdf.text(subject, xPos + 5, yPos + 10);
        xPos += colWidths[0];
        
        // Grade with color coding
        const testScore = parseFloat(testAvg);
        if (testAvg !== '-') {
          if (testScore >= 6.5) pdf.setTextColor(34, 139, 34);
          else if (testScore >= 5.5) pdf.setTextColor(255, 152, 0);
          else pdf.setTextColor(220, 53, 69);
        } else {
          pdf.setTextColor(64, 75, 105);
        }
        pdf.text(testAvg, xPos + 15, yPos + 10, { align: 'center' });
        xPos += colWidths[1];
        
        // Task average with color coding
        const taskScore = parseFloat(taskAvg);
        if (taskAvg !== '-') {
          if (taskScore >= 6.5) pdf.setTextColor(34, 139, 34);
          else if (taskScore >= 5.5) pdf.setTextColor(255, 152, 0);
          else pdf.setTextColor(220, 53, 69);
        } else {
          pdf.setTextColor(64, 75, 105);
        }
        pdf.text(taskAvg, xPos + 15, yPos + 10, { align: 'center' });
        xPos += colWidths[2];
        
        // Exam grade (placeholder for now)
        pdf.setTextColor(64, 75, 105);
        pdf.text('-', xPos + 15, yPos + 10, { align: 'center' });
        xPos += colWidths[3];
        
        // Comments based on performance
        pdf.setTextColor(64, 75, 105);
        const avgScore = (parseFloat(testAvg) + parseFloat(taskAvg)) / 2;
        let comment = 'Goed';
        if (!isNaN(avgScore)) {
          if (avgScore >= 8) comment = 'Uitstekend';
          else if (avgScore >= 7) comment = 'Goed';
          else if (avgScore >= 6) comment = 'Voldoende';
          else comment = 'Aandacht nodig';
        }
        const shortComment = comment.substring(0, 8);
        pdf.text(shortComment, xPos + 2, yPos + 10);
        
        yPos += 15;
      });

      yPos += 20;

      // General Comments section on first page - simplified
      yPos += 20;
      
      pdf.setFillColor(248, 249, 250);
      pdf.rect(20, yPos, pageWidth - 40, 60, 'F');
      pdf.setDrawColor(33, 107, 169);
      pdf.setLineWidth(0.5);
      pdf.rect(20, yPos, pageWidth - 40, 60, 'D');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 107, 169);
      pdf.text('ALGEMENE OPMERKINGEN', 25, yPos + 15);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(64, 75, 105);
      
      if (generalComments[report.student.id]) {
        const commentLines = pdf.splitTextToSize(generalComments[report.student.id], pageWidth - 60);
        pdf.text(commentLines, 25, yPos + 30);
      } else {
        pdf.text('Leerling toont goede vooruitgang in alle aspecten van het onderwijs.', 25, yPos + 30);
      }

      // Footer on first page
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Pagina 1 van 2', pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Start new page for behavior and attendance
      pdf.addPage();
      yPos = 20;

      // Header for second page - same as first page
      pdf.setFillColor(233, 243, 250);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setFillColor(33, 107, 169);
      pdf.rect(0, 0, pageWidth, 3, 'F');

      // School name as title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 107, 169);
      pdf.text(schoolName, 20, 25);
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 107, 169);
      pdf.text('SCHOOLRAPPORT', pageWidth - 20, 25, { align: 'right' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(64, 75, 105);
      pdf.text(`Schooljaar ${report.student.academicYear || '2024-2025'}`, pageWidth - 20, 35, { align: 'right' });

      yPos = 65;

      // Behavior section - simplified layout
      pdf.setFillColor(248, 249, 250);
      pdf.rect(20, yPos, pageWidth - 40, 80, 'F');
      pdf.setDrawColor(33, 107, 169);
      pdf.setLineWidth(0.5);
      pdf.rect(20, yPos, pageWidth - 40, 80, 'D');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 107, 169);
      pdf.text('GEDRAGSBEOORDELING', 25, yPos + 15);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(64, 75, 105);
      pdf.text(`Gedragscijfer: ${behaviorGrades[report.student.id]?.grade || 7}/10`, 25, yPos + 30);
      
      if (behaviorGrades[report.student.id]?.comments) {
        const behaviorComments = pdf.splitTextToSize(behaviorGrades[report.student.id]?.comments, pageWidth - 60);
        pdf.text(behaviorComments, 25, yPos + 45);
      } else {
        pdf.text('De leerling toont respectvol en positief gedrag tijdens alle lessen.', 25, yPos + 45);
        pdf.text('Samenwerking met medeleerlingen verloopt goed.', 25, yPos + 55);
      }
      
      yPos += 90;
      
      // Attendance section - simplified layout
      pdf.setFillColor(248, 249, 250);
      pdf.rect(20, yPos, pageWidth - 40, 70, 'F');
      pdf.setDrawColor(33, 107, 169);
      pdf.setLineWidth(0.5);
      pdf.rect(20, yPos, pageWidth - 40, 70, 'D');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 107, 169);
      pdf.text('AANWEZIGHEID', 25, yPos + 15);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(64, 75, 105);
      pdf.text(`Aantal keer afwezig: ${report.attendance.absent} dagen`, 25, yPos + 30);
      pdf.text(`Aantal keer te laat: ${report.attendance.late} keer`, 25, yPos + 45);
      
      // Calculate attendance percentage
      const totalDays = 180; // Approximate school days
      const attendancePercentage = ((totalDays - report.attendance.absent) / totalDays * 100).toFixed(1);
      pdf.text(`Aanwezigheidspercentage: ${attendancePercentage}%`, 25, yPos + 60);
      
      // Add attendance comments if available
      if (attendanceComments[report.student.id]) {
        pdf.setFontSize(10);
        pdf.setTextColor(64, 75, 105);
        const comments = pdf.splitTextToSize(attendanceComments[report.student.id], pageWidth - 60);
        pdf.text(comments, 25, yPos + 75);
      }

      yPos += 80;

      // Simple signature section at bottom
      const signatureYPos = pageHeight - 50;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(64, 75, 105);
      
      const sigWidth = (pageWidth - 60) / 2;
      
      // Parent signature
      pdf.text('Handtekening Ouder/Voogd:', 25, signatureYPos);
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.5);
      pdf.line(25, signatureYPos + 15, 25 + sigWidth - 10, signatureYPos + 15);
      
      // School signature  
      pdf.text('Handtekening School:', pageWidth / 2 + 15, signatureYPos);
      pdf.line(pageWidth / 2 + 15, signatureYPos + 15, pageWidth - 35, signatureYPos + 15);

      // Footer on second page
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Pagina 2 van 2', pageWidth / 2, pageHeight - 10, { align: 'center' });
    });

    // Save the PDF
    const fileName = selectedReportType === 'class' 
      ? `Klasserapport_${classesData?.find((c: StudentGroup) => c.id.toString() === selectedClass)?.name || 'Onbekend'}_${new Date().toLocaleDateString('nl-NL')}.pdf`
      : `Rapport_${reportData[0]?.student.firstName}_${reportData[0]?.student.lastName}_${new Date().toLocaleDateString('nl-NL')}.pdf`;
    
    pdf.save(fileName);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Rapportage</h1>
              <p className="text-gray-600">Genereer professionele schoolrapporten met cijfers en beoordeling</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Rapport Configuratie
                    </CardTitle>
                    <CardDescription>
                      Stel uw rapport parameters in
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Report Type Selection */}
                    <div className="space-y-2">
                      <Label>Type Rapport</Label>
                      <Select value={selectedReportType} onValueChange={(value: 'class' | 'individual') => setSelectedReportType(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer rapporttype" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="class">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Klasserapport
                            </div>
                          </SelectItem>
                          <SelectItem value="individual">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Individueel Rapport
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

              {/* Class/Student Selection */}
              {selectedReportType === 'class' ? (
                <div className="space-y-2">
                  <Label>Klas</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer klas" />
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
              ) : (
                <div className="space-y-2">
                  <Label>Student</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer student" />
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

              <Separator />

              {/* School Name Input */}
              <div className="space-y-2">
                <Label htmlFor="school-name">Schoolnaam</Label>
                <Input
                  id="school-name"
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Voer schoolnaam in..."
                  className="w-full"
                />
              </div>

              <Separator />

              {/* General Comments */}
              <div className="space-y-2">
                <Label>Algemene Opmerkingen</Label>
                <Textarea
                  value={generalComments[parseInt(selectedStudent)] || ''}
                  onChange={(e) => setGeneralComments(prev => ({
                    ...prev,
                    [parseInt(selectedStudent) || 0]: e.target.value
                  }))}
                  placeholder="Voeg algemene opmerkingen toe voor de geselecteerde student..."
                  className="min-h-[100px]"
                />
              </div>

              {/* Behavior Grade */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gedragscijfer (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={behaviorGrades[parseInt(selectedStudent)]?.grade || 7}
                    onChange={(e) => setBehaviorGrades(prev => ({
                      ...prev,
                      [parseInt(selectedStudent) || 0]: {
                        ...prev[parseInt(selectedStudent) || 0],
                        studentId: parseInt(selectedStudent) || 0,
                        grade: parseInt(e.target.value) || 7,
                        comments: prev[parseInt(selectedStudent) || 0]?.comments || ''
                      }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gedragsopmerkingen</Label>
                  <Textarea
                    value={behaviorGrades[parseInt(selectedStudent)]?.comments || ''}
                    onChange={(e) => setBehaviorGrades(prev => ({
                      ...prev,
                      [parseInt(selectedStudent) || 0]: {
                        ...prev[parseInt(selectedStudent) || 0],
                        studentId: parseInt(selectedStudent) || 0,
                        grade: prev[parseInt(selectedStudent) || 0]?.grade || 7,
                        comments: e.target.value
                      }
                    }))}
                    placeholder="Gedragsopmerkingen..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              {/* Attendance Comments */}
              <div className="space-y-2">
                <Label>Aanwezigheidsopmerkingen</Label>
                <Textarea
                  value={attendanceComments[parseInt(selectedStudent)] || ''}
                  onChange={(e) => setAttendanceComments(prev => ({
                    ...prev,
                    [parseInt(selectedStudent) || 0]: e.target.value
                  }))}
                  placeholder="Voeg opmerkingen toe over aanwezigheid..."
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Acties</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      onClick={generatePreviewData}
                      disabled={!selectedClass && !selectedStudent}
                      className="w-full"
                      variant="outline"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Bekijk Rapportoverzicht
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
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Rapport bevat:</p>
                      <ul className="list-disc list-inside text-xs space-y-1 ml-2">
                        <li>Pagina 1: Cijfertabel en algemene opmerkingen</li>
                        <li>Pagina 2: Gedragsbeoordeling en aanwezigheid</li>
                        <li>Handtekeningvelden voor ouders en school</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

          {/* Report Preview */}
          {reportPreview.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Rapportoverzicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportPreview.map((report) => (
                  <div key={report.student.id} className="border rounded-lg p-4 space-y-3">
                    <div className="font-medium text-lg">
                      {report.student.firstName} {report.student.lastName} ({report.student.studentId})
                    </div>
                    
                    {/* Grades Summary */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Cijfers:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(report.grades).map(([subject, grades]) => {
                          const testAvg = grades.tests.length > 0 ? (grades.tests.reduce((sum, g) => sum + (g.score/g.maxScore)*10, 0) / grades.tests.length).toFixed(1) : '-';
                          const taskAvg = grades.tasks.length > 0 ? (grades.tasks.reduce((sum, g) => sum + (g.score/g.maxScore)*10, 0) / grades.tasks.length).toFixed(1) : '-';
                          return (
                            <div key={subject} className="flex justify-between">
                              <span>{subject}:</span>
                              <span>T:{testAvg} / O:{taskAvg}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Attendance Summary */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Aanwezigheid:</h4>
                      <div className="text-sm grid grid-cols-2 gap-2">
                        <div>Afwezig: {report.attendance.absent} dagen</div>
                        <div>Te laat: {report.attendance.late} keer</div>
                        <div>Percentage: {report.attendance.percentage}%</div>
                        <div>Gedrag: {report.behavior.grade}/10</div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}