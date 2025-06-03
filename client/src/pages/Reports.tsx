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
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [schoolName, setSchoolName] = useState('myMadrassa');
  const [reportPeriod, setReportPeriod] = useState('');
  const [generalComments, setGeneralComments] = useState('');
  const [attendanceComments, setAttendanceComments] = useState('');
  const [reportPreview, setReportPreview] = useState<ReportData[]>([]);
  const [behaviorGrades, setBehaviorGrades] = useState<{[key: number]: BehaviorGrade}>({});

  const { data: classesData } = useQuery({ queryKey: ['/api/student-groups'] });
  const { data: studentsData } = useQuery({ queryKey: ['/api/students'] });
  const { data: gradesData } = useQuery({ queryKey: ['/api/grades'] });
  const { data: attendanceData } = useQuery({ queryKey: ['/api/attendance'] });
  const { data: programsData } = useQuery({ queryKey: ['/api/programs'] });

  const generatePreviewData = () => {
    if (selectedReportType === 'class' && selectedClass) {
      const classStudents = studentsData?.filter((s: Student) => 
        classesData?.find((c: StudentGroup) => c.id.toString() === selectedClass)?.id
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
    } else if (selectedReportType === 'individual' && selectedStudent) {
      const student = studentsData?.find((s: Student) => s.id.toString() === selectedStudent);
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

      const subjects = programsData?.programs || [];
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
      ? `Klasserapport_${classesData?.find((c: StudentGroup) => c.id.toString() === selectedClass)?.name || 'Onbekend'}_${new Date().toLocaleDateString('nl-NL')}.pdf`
      : `Individueel_Rapport_${reportPreview[0]?.student.firstName}_${reportPreview[0]?.student.lastName}_${new Date().toLocaleDateString('nl-NL')}.pdf`;
    
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
                        <Label>Selecteer Klas</Label>
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
                    ) : (
                      <div className="space-y-2">
                        <Label>Selecteer Student</Label>
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

                    <Separator />

                    {/* School Configuration */}
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

                    <Separator />

                    {/* Comments */}
                    <div className="space-y-4">
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
                    <CardContent>
                      {reportPreview.map((student, index) => (
                        <div key={index} className="mb-4 p-4 border rounded">
                          <h3 className="font-semibold text-lg mb-2">
                            {student.student.firstName} {student.student.lastName}
                          </h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p><strong>Student ID:</strong> {student.student.studentId}</p>
                              <p><strong>Aanwezigheid:</strong> {student.attendance.percentage.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p><strong>Gedragsgemiddelde:</strong> {student.behavior.grade}/10</p>
                              <p><strong>Algemene opmerkingen:</strong> {student.generalComments || 'Geen opmerkingen'}</p>
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