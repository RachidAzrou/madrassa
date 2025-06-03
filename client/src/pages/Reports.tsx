import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [schoolLogo, setSchoolLogo] = useState<string>('');
  const [generalComments, setGeneralComments] = useState<{[key: number]: string}>({});
  const [behaviorGrades, setBehaviorGrades] = useState<{[key: number]: BehaviorGrade}>({});

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
        // Fetch attendance data using the correct endpoint
        const attendanceResponse = await fetch(`/api/students/${student.id}/attendance`);
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
      pdf.setFillColor(248, 249, 250);
      pdf.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'F');
      
      pdf.setDrawColor(33, 107, 169);
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
      pdf.setFillColor(33, 107, 169);
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
        
        // Comments (brief)
        pdf.setTextColor(64, 75, 105);
        pdf.text('Goed', xPos + 5, yPos + 10);
        
        yPos += 15;
      });

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

      // Header for second page - smaller
      pdf.setFillColor(233, 243, 250);
      pdf.rect(0, 0, pageWidth, 45, 'F');
      
      pdf.setFillColor(33, 107, 169);
      pdf.rect(0, 0, pageWidth, 3, 'F');

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(33, 107, 169);
      pdf.text('🕌 myMadrassa - Rapport Pagina 2', 20, 20);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(64, 75, 105);
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
      
      // Parent signature box
      pdf.setFillColor(252, 252, 252);
      pdf.rect(20, yPos, finalSigWidth, 50, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(20, yPos, finalSigWidth, 50, 'D');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(64, 75, 105);
      pdf.text('Handtekening Ouder/Voogd:', 25, yPos + 10);
      pdf.text('Datum: ____________________', 25, yPos + 40);
      
      // School signature box
      pdf.setFillColor(252, 252, 252);
      pdf.rect(30 + finalSigWidth, yPos, finalSigWidth, 50, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(30 + finalSigWidth, yPos, finalSigWidth, 50, 'D');
      
      pdf.text('Handtekening School:', 35 + finalSigWidth, yPos + 10);
      pdf.text('Datum: ____________________', 35 + finalSigWidth, yPos + 40);

      // Footer with timestamp on second page
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Pagina 2 van 2 - Gedrag & Aanwezigheid - Gegenereerd op ${new Date().toLocaleDateString('nl-NL')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    });

    // Save the PDF
    const fileName = selectedReportType === 'class' 
      ? `Klasserapport_${classesData?.find((c: StudentGroup) => c.id.toString() === selectedClass)?.name || 'Onbekend'}_${new Date().toLocaleDateString('nl-NL')}.pdf`
      : `Rapport_${reportData[0]?.student.firstName}_${reportData[0]?.student.lastName}_${new Date().toLocaleDateString('nl-NL')}.pdf`;
    
    pdf.save(fileName);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Rapportage</h1>
        <p className="text-gray-600">Genereer professionele schoolrapporten voor studenten</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Rapport Configuratie
              </CardTitle>
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

              {/* School Logo Upload */}
              <div className="space-y-2">
                <Label htmlFor="logo-upload">School Logo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="flex-1"
                  />
                  <Upload className="h-4 w-4 text-gray-400" />
                </div>
                {schoolLogo && (
                  <div className="mt-2">
                    <img src={schoolLogo} alt="School Logo" className="h-16 w-auto border rounded" />
                  </div>
                )}
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
                onClick={generateReportData}
                disabled={!selectedClass && !selectedStudent}
                className="w-full"
                size="lg"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Genereer PDF Rapport
              </Button>
              
              <div className="text-sm text-gray-600 space-y-1">
                <p>📋 Rapport bevat:</p>
                <ul className="list-disc list-inside text-xs space-y-1 ml-2">
                  <li>Pagina 1: Cijfertabel en algemene opmerkingen</li>
                  <li>Pagina 2: Gedragsbeoordeling en aanwezigheid</li>
                  <li>Professionele layout met school logo</li>
                  <li>Handtekeningvelden voor ouders en school</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}