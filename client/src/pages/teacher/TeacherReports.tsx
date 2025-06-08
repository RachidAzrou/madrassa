import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { FileDown, Users, User, BookMarked, BarChart3, Target, Settings, Eye, Download, TrendingUp, Calculator, School, Calendar, CheckCircle, AlertCircle, Clock, Save, Loader2, Trash2, Edit, BookText, ClipboardCheck, Percent, FileText } from 'lucide-react';
import { PremiumHeader } from '@/components/layout/premium-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from '@/lib/queryClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import JSZip from 'jszip';

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

export default function TeacherReports() {
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
  
  // Dialog states - Admin style
  const [saveTemplateDialog, setSaveTemplateDialog] = useState(false);
  const [loadTemplateDialog, setLoadTemplateDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [templateName, setTemplateName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        behavior: behaviorGrades[student.id] || { studentId: student.id, grade: 3, comments: '' },
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
          behavior: behaviorGrades[student.id] || { studentId: student.id, grade: 3, comments: '' },
          generalComments
        }];
        
        setReportPreview(previewData);
        setActiveTab('preview');
      }
    }
  };

  const generateReportData = async () => {
    if (!reportPreview.length) {
      generatePreviewData();
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      if (selectedReportType === 'class' && reportPreview.length > 1) {
        // Voor klassenrapporten: genereer ZIP met aparte PDF's
        const zip = new JSZip();
        const className = classes.find((c: StudentGroup) => c.id.toString() === selectedClass)?.name || 'Onbekend';
        const currentDate = new Date().toLocaleDateString('nl-NL');

        for (let i = 0; i < reportPreview.length; i++) {
          const studentData = reportPreview[i];
          setGenerationProgress(((i + 1) / reportPreview.length) * 80);
          
          const pdf = generateStudentPDF(studentData);
          const pdfBlob = pdf.output('blob');
          const fileName = `${studentData.student.firstName}_${studentData.student.lastName}_${studentData.student.studentId}.pdf`;
          zip.file(fileName, pdfBlob);
          
          // Kleine delay voor UX
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        setGenerationProgress(90);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipFileName = `Klasserapport_${className}_${currentDate}.zip`;
        
        setGenerationProgress(100);
        
        // Download ZIP bestand
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = zipFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Rapporten gegenereerd",
          description: `${reportPreview.length} rapporten succesvol gedownload als ZIP.`,
        });
      } else {
        // Voor individuele rapporten: genereer enkele PDF
        setGenerationProgress(50);
        const pdf = generateStudentPDF(reportPreview[0]);
        setGenerationProgress(100);
        
        const fileName = `Individueel_Rapport_${reportPreview[0]?.student.firstName}_${reportPreview[0]?.student.lastName}_${new Date().toLocaleDateString('nl-NL')}.pdf`;
        pdf.save(fileName);

        toast({
          title: "Rapport gegenereerd",
          description: "Individueel rapport succesvol gedownload.",
        });
      }
    } catch (error) {
      toast({
        title: "Fout bij genereren",
        description: "Er is een fout opgetreden bij het genereren van de rapporten.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  // Template functies - Admin style
  const saveTemplate = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/teacher/report-templates', { 
        method: 'POST', 
        body: data 
      });
    },
    onSuccess: () => {
      toast({
        title: "Template opgeslagen",
        description: "Rapportsjabloon is succesvol opgeslagen.",
      });
      setSaveTemplateDialog(false);
      setTemplateName('');
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/report-templates'] });
    },
    onError: () => {
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan van het sjabloon.",
        variant: "destructive",
      });
    }
  });

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      return apiRequest(`/api/teacher/report-templates/${templateId}`, { 
        method: 'DELETE' 
      });
    },
    onSuccess: () => {
      toast({
        title: "Template verwijderd",
        description: "Rapportsjabloon is succesvol verwijderd.",
      });
      setDeleteConfirmDialog(false);
      setSelectedTemplate(null);
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/report-templates'] });
    },
    onError: () => {
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van het sjabloon.",
        variant: "destructive",
      });
    }
  });

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast({
        title: "Naam vereist",
        description: "Voer een naam in voor het sjabloon.",
        variant: "destructive",
      });
      return;
    }

    const templateData = {
      name: templateName,
      reportType: selectedReportType,
      classId: selectedClass,
      studentId: selectedStudent,
      schoolName,
      reportPeriod,
      generalComments,
      attendanceComments,
      behaviorGrades
    };

    saveTemplate.mutate(templateData);
  };

  const handleLoadTemplate = (template: any) => {
    setSelectedReportType(template.reportType);
    setSelectedClass(template.classId || '');
    setSelectedStudent(template.studentId || '');
    setSchoolName(template.schoolName || 'myMadrassa');
    setReportPeriod(template.reportPeriod || '');
    setGeneralComments(template.generalComments || '');
    setAttendanceComments(template.attendanceComments || '');
    setBehaviorGrades(template.behaviorGrades || {});
    
    setLoadTemplateDialog(false);
    toast({
      title: "Template geladen",
      description: `Sjabloon "${template.name}" is geladen.`,
    });
  };

  const handleDeleteTemplate = (template: any) => {
    setSelectedTemplate(template);
    setDeleteConfirmDialog(true);
  };

  const generateStudentPDF = (studentData: ReportData) => {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;

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

    // General comments - gebruik individuele opmerkingen per student
    const finalY = (pdf as any).lastAutoTable.finalY + 15;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ALGEMENE OPMERKINGEN', margin, finalY);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const commentLines = pdf.splitTextToSize(studentData.generalComments || 'Geen algemene opmerkingen', pageWidth - 2 * margin);
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
    pdf.text(`Gedragscijfer: ${studentData.behavior.grade}/5`, margin, 75);
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

    return pdf;
  };

  const filteredStudents = students.filter((student: Student) => {
    if (selectedReportType === 'class' && selectedClass) {
      const selectedClassData = classes.find((c: StudentGroup) => c.id.toString() === selectedClass);
      return selectedClassData;
    }
    return true;
  });

  return (
    <div className="bg-[#f7f9fc] min-h-screen overflow-visible">
      <PremiumHeader 
        title="Rapportage" 
        icon={BookMarked}
        description="Genereer professionele schoolrapporten met cijfers en beoordeling"
        breadcrumbs={{
          parent: "Docent",
          current: "Rapporten"
        }}
      />
      <div className="px-6 py-6 overflow-visible">
        <div className="space-y-5 overflow-visible">
        <Tabs 
          value={activeTab} 
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="grid w-full grid-cols-2 h-11">
            <TabsTrigger value="configure" className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuratie
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Voorvertoning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                {/* Report Type Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
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
                            <h3 className="font-semibold">Klas-rapport</h3>
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
                      <School className="h-5 w-5" />
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

              </div>

              {/* Actions Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      Acties
                    </CardTitle>
                    <CardDescription>
                      Genereer en download schoolrapporten
                    </CardDescription>
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
                      disabled={(!selectedClass && !selectedStudent) || isGenerating}
                      className="w-full"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Genereren...
                        </>
                      ) : (
                        <>
                          <FileDown className="h-4 w-4 mr-2" />
                          {selectedReportType === 'class' ? 'Download ZIP (Alle Rapporten)' : 'Genereer PDF Rapport'}
                        </>
                      )}
                    </Button>
                    
                    {isGenerating && (
                      <div className="w-full">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Voortgang</span>
                          <span>{generationProgress}%</span>
                        </div>
                        <Progress value={generationProgress} className="w-full" />
                      </div>
                    )}

                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium text-sm mb-3">Sjabloon Beheer</h4>
                      <div className="space-y-2">
                        <Button 
                          onClick={() => setSaveTemplateDialog(true)}
                          disabled={!selectedClass && !selectedStudent}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Sjabloon Opslaan
                        </Button>
                        <Button 
                          onClick={() => setLoadTemplateDialog(true)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Sjabloon Laden
                        </Button>
                      </div>
                    </div>
                    
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
                            <Badge variant={student.behavior.grade >= 4 ? "default" : "secondary"}>
                              Gedrag: {student.behavior.grade}/5
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

                        {/* Complete cijfersamenvatting */}
                        <div className="mb-6">
                          <h5 className="font-semibold mb-4 flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            Complete Cijfersamenvatting
                          </h5>
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-200">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="border border-gray-200 px-3 py-2 text-left font-semibold">Vak</th>
                                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold">Testen</th>
                                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold">Taken</th>
                                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold">Examen</th>
                                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold">Gemiddelde</th>
                                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold">Beoordeling</th>
                                </tr>
                              </thead>
                              <tbody>
                                {subjects.map((subject: any, subjectIndex: number) => {
                                  // Simuleer echte cijfers voor elke student
                                  const testGrades = [7.5, 8.2, 6.8, 7.9];
                                  const taskGrades = [8.0, 7.5, 8.5, 7.2];
                                  const examGrade = 7.8;
                                  const average = (
                                    (testGrades.reduce((a, b) => a + b, 0) / testGrades.length * 0.3) +
                                    (taskGrades.reduce((a, b) => a + b, 0) / taskGrades.length * 0.3) +
                                    (examGrade * 0.4)
                                  );
                                  
                                  let assessment = '';
                                  let assessmentColor = '';
                                  if (average >= 8.5) {
                                    assessment = 'Uitstekend';
                                    assessmentColor = 'bg-green-100 text-green-800';
                                  } else if (average >= 7.5) {
                                    assessment = 'Goed';
                                    assessmentColor = 'bg-blue-100 text-blue-800';
                                  } else if (average >= 6.5) {
                                    assessment = 'Voldoende';
                                    assessmentColor = 'bg-yellow-100 text-yellow-800';
                                  } else {
                                    assessment = 'Aandacht nodig';
                                    assessmentColor = 'bg-red-100 text-red-800';
                                  }

                                  return (
                                    <tr key={subjectIndex} className="hover:bg-gray-50">
                                      <td className="border border-gray-200 px-3 py-2 font-medium">{subject.name}</td>
                                      <td className="border border-gray-200 px-3 py-2 text-center">
                                        <div className="flex flex-wrap gap-1 justify-center">
                                          {testGrades.map((grade, idx) => (
                                            <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                                              {grade}
                                            </span>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="border border-gray-200 px-3 py-2 text-center">
                                        <div className="flex flex-wrap gap-1 justify-center">
                                          {taskGrades.map((grade, idx) => (
                                            <span key={idx} className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                                              {grade}
                                            </span>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="border border-gray-200 px-3 py-2 text-center">
                                        <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-sm font-semibold">
                                          {examGrade}
                                        </span>
                                      </td>
                                      <td className="border border-gray-200 px-3 py-2 text-center">
                                        <span className="font-bold text-lg">
                                          {average.toFixed(1)}
                                        </span>
                                      </td>
                                      <td className="border border-gray-200 px-3 py-2 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${assessmentColor}`}>
                                          {assessment}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Legenda */}
                          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-blue-50 border border-blue-200 rounded"></div>
                              <span>Testen (30%)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-purple-50 border border-purple-200 rounded"></div>
                              <span>Taken (30%)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded"></div>
                              <span>Examen (40%)</span>
                            </div>
                          </div>
                        </div>

                        {/* Commentaren sectie */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-semibold mb-2 block">
                                Gedragscijfer (1-5)
                              </Label>
                              <Select 
                                value={behaviorGrades[student.student.id]?.grade?.toString() || '3'} 
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
                                  <SelectItem value="1">1/5 - Onvoldoende</SelectItem>
                                  <SelectItem value="2">2/5 - Matig</SelectItem>
                                  <SelectItem value="3">3/5 - Voldoende</SelectItem>
                                  <SelectItem value="4">4/5 - Goed</SelectItem>
                                  <SelectItem value="5">5/5 - Uitstekend</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
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
                                    grade: prev[student.student.id]?.grade || 3,
                                    comments: e.target.value
                                  }
                                }))}
                                rows={4}
                                className="resize-none"
                              />
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
                  <Button onClick={() => generatePreviewData()} variant="outline" size="lg">
                    <Eye className="h-4 w-4 mr-2" />
                    Ververs voorvertoning
                  </Button>
                  <Button onClick={generateReportData} size="lg">
                    <FileDown className="h-4 w-4 mr-2" />
                    {selectedReportType === 'class' ? 'Download ZIP (Alle Rapporten)' : 'Download PDF Rapport'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-12 w-12 text-gray-400 mx-auto mb-4">
                  <BookMarked className="h-full w-full" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen rapportgegevens</h3>
                <p className="text-gray-600 mb-4">Configureer eerst uw rapport instellingen om een voorvertoning te zien.</p>
                <Button onClick={() => setActiveTab('configure')} variant="outline">
                  Ga naar configuratie
                </Button>
              </div>
            )}
          </TabsContent>

        </Tabs>
        </div>
      </div>

      {/* Admin-style Dialogs */}
      
      {/* Save Template Dialog */}
      <Dialog open={saveTemplateDialog} onOpenChange={setSaveTemplateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-blue-600" />
              Sjabloon Opslaan
            </DialogTitle>
            <DialogDescription>
              Sla uw huidige rapportconfiguratie op als herbruikbaar sjabloon.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Sjabloon Naam</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Geef uw sjabloon een naam..."
                className="w-full"
              />
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p className="font-medium text-gray-700 mb-1">Wordt opgeslagen:</p>
              <ul className="text-gray-600 space-y-1">
                <li>• Rapport type: {selectedReportType === 'class' ? 'Klasserapport' : 'Individueel rapport'}</li>
                <li>• School instellingen</li>
                <li>• Commentaren en opmerkingen</li>
                <li>• Gedragsbeoordeling instellingen</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setSaveTemplateDialog(false)}
              disabled={saveTemplate.isPending}
            >
              Annuleren
            </Button>
            <Button 
              onClick={handleSaveTemplate}
              disabled={saveTemplate.isPending || !templateName.trim()}
            >
              {saveTemplate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Opslaan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Template Dialog */}
      <Dialog open={loadTemplateDialog} onOpenChange={setLoadTemplateDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              Sjabloon Laden
            </DialogTitle>
            <DialogDescription>
              Kies een opgeslagen sjabloon om uw rapportconfiguratie te laden.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {/* Mock templates - in werkelijkheid uit API */}
              {[
                { id: 1, name: 'Kwartaal 1 - Standaard', reportType: 'class', lastUsed: '2024-01-15' },
                { id: 2, name: 'Individueel Rapport - Uitgebreid', reportType: 'individual', lastUsed: '2024-01-10' },
                { id: 3, name: 'Eind van jaar rapport', reportType: 'class', lastUsed: '2024-01-05' }
              ].map((template) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BookMarked className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Type: {template.reportType === 'class' ? 'Klasserapport' : 'Individueel'}</span>
                          <span>Laatst gebruikt: {template.lastUsed}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadTemplate(template)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Laden
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {/* Empty state */}
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Geen opgeslagen sjablonen gevonden</p>
              <p className="text-sm">Maak eerst een rapport en sla het op als sjabloon.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadTemplateDialog(false)}>
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmDialog} onOpenChange={setDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Sjabloon Verwijderen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Weet u zeker dat u het sjabloon "{selectedTemplate?.name}" wilt verwijderen? 
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTemplate.isPending}>
              Annuleren
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTemplate && deleteTemplate.mutate(selectedTemplate.id)}
              disabled={deleteTemplate.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteTemplate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verwijderen...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Verwijderen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}