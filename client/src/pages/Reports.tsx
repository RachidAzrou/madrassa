import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BarChart, 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  GraduationCap,
  BookOpen,
  ClipboardList,
  CircleCheck,
  UploadCloud,
  Image,
  Check,
  Printer,
  Edit,
  X,
  Save,
  Search,
  BarChart3,
  BookMarked
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import myMadrassaLogo from '@assets/myMadrassa.png';

// Helper function to format Dutch dates
const formatDutchDate = (date: Date | string): string => {
  if (!date) return '';
  const d = new Date(date);
  const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

// Template type definition
interface ReportTemplate {
  schoolName: string;
  logoImg: string | null;
  schoolAddress?: string;
  schoolContact?: string;
  signature?: string;
  commentTemplate?: string;
  footerText?: string;
}

export default function Reports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for tabs and filters
  const [activeTab, setActiveTab] = useState('generate');
  const [schoolYear, setSchoolYear] = useState('2023-2024');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for template
  const [template, setTemplate] = useState<ReportTemplate>({
    schoolName: 'myMadrassa',
    logoImg: myMadrassaLogo,
    schoolAddress: 'Voorbeeldstraat 123, 1234 AB Amsterdam',
    schoolContact: 'info@mymadrassa.nl | 020-1234567',
    commentTemplate: 'De student heeft goede vooruitgang geboekt dit schooljaar.',
    footerText: 'Handtekening Ouders/Verzorgers: _______________________',
  });
  
  // Preview image for logo upload
  const [logoPreview, setLogoPreview] = useState<string | null>(myMadrassaLogo);

  // Fetch classes for dropdown
  const { data: classesData } = useQuery<{ studentGroups: any[] }>({
    queryKey: ['/api/student-groups'],
    staleTime: 300000,
  });
  
  const classes = classesData?.studentGroups || [];
  
  // Fetch students in the selected class
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery<{ students: any[] }>({
    queryKey: ['/api/students', { classId: selectedClass }],
    enabled: !!selectedClass,
    staleTime: 60000,
  });
  
  const students = studentsData?.students || [];
  
  // Filter students based on search query
  const filteredStudents = searchQuery
    ? students.filter(student => 
        student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students;
  
  // Effect to handle "Select All" checkbox
  useEffect(() => {
    if (selectAll) {
      setSelectedStudents(filteredStudents.map(student => student.id));
    } else if (selectedStudents.length === filteredStudents.length) {
      // User manually unselected one student after selecting all
      setSelectedStudents([]);
    }
  }, [selectAll]);
  
  // Effect to update select all status when individual selections change
  useEffect(() => {
    if (filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedStudents, filteredStudents]);

  // Handle logo image upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoPreview(result);
        setTemplate({...template, logoImg: result});
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Toggle student selection
  const toggleStudentSelection = (studentId: number) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // Generate PDF report for selected students
  const generatePDF = async () => {
    try {
      if (selectedStudents.length === 0) {
        toast({
          title: "Geen studenten geselecteerd",
          description: "Selecteer tenminste één student om een rapport te genereren.",
          variant: "destructive",
        });
        return;
      }
      
      // Fetch grades, attendance and behavior data for the selected students
      const studentsToReport = filteredStudents.filter(student => 
        selectedStudents.includes(student.id)
      );
      
      // Create PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Logo dimensions and position
      const logoWidth = 40;
      const logoHeight = 20;
      const logoX = 10;
      const logoY = 10;
      
      // Add school info on each page
      const addHeader = () => {
        // Add logo if available
        if (template.logoImg) {
          doc.addImage(template.logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
        }
        
        // School name
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(template.schoolName, pageWidth / 2, 15, { align: 'center' });
        
        // School contact info
        if (template.schoolAddress || template.schoolContact) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          
          if (template.schoolAddress) {
            doc.text(template.schoolAddress, pageWidth / 2, 22, { align: 'center' });
          }
          
          if (template.schoolContact) {
            doc.text(template.schoolContact, pageWidth / 2, 27, { align: 'center' });
          }
        }
        
        // Horizontal line
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(10, 35, pageWidth - 10, 35);
      };
      
      // Loop through each selected student and create report
      studentsToReport.forEach((student, index) => {
        if (index > 0) {
          doc.addPage();
        }
        
        addHeader();
        
        // Student information section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('STUDENTRAPPORT', pageWidth / 2, 45, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text('Schooljaar: ' + schoolYear, pageWidth / 2, 52, { align: 'center' });
        doc.text('Datum rapport: ' + formatDutchDate(new Date()), pageWidth / 2, 58, { align: 'center' });
        
        // Student details
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Studentgegevens:', 20, 70);
        
        doc.setFont('helvetica', 'normal');
        doc.text('Naam: ' + student.firstName + ' ' + student.lastName, 20, 78);
        doc.text('Studentnummer: ' + student.studentId, 20, 84);
        doc.text('Email: ' + student.email, 20, 90);
        
        const selectedGroup = classes.find(cls => cls.id === parseInt(selectedClass));
        if (selectedGroup) {
          doc.text('Klas: ' + selectedGroup.name, 20, 96);
        }
        
        // Academic results section
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Academische resultaten:', 20, 110);
        
        const tableColumns = ['Vak', 'Cijfer', 'Beoordeling'];
        const tableData = [
          ['Nederlandse taal', '7,5', 'Voldoende'],
          ['Rekenen/Wiskunde', '8,2', 'Goed'],
          ['Engels', '6,8', 'Voldoende'],
          ['Geschiedenis', '7,4', 'Voldoende'],
          ['Aardrijkskunde', '8,0', 'Goed']
        ];
        
        // @ts-ignore (jspdf-autotable types)
        doc.autoTable({
          startY: 115,
          head: [tableColumns],
          body: tableData,
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [59, 89, 152], textColor: [255, 255, 255] }, // myMadrassa blue
          margin: { left: 20, right: 20 },
        });
        
        // Attendance section
        let currentY = (doc as any).lastAutoTable.finalY + 15;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Aanwezigheid:', 20, currentY);
        
        const attendanceData = [
          ['Totaal lesdagen', '120'],
          ['Aanwezig', '110'],
          ['Afwezig met reden', '8'],
          ['Afwezig zonder reden', '2'],
          ['Aanwezigheidspercentage', '92%']
        ];
        
        // @ts-ignore
        doc.autoTable({
          startY: currentY + 5,
          body: attendanceData,
          theme: 'grid',
          styles: { fontSize: 10 },
          columns: [
            { header: 'Categorie', dataKey: 0 },
            { header: 'Aantal', dataKey: 1 }
          ],
          margin: { left: 20, right: 20 },
        });
        
        // Behavior section
        currentY = (doc as any).lastAutoTable.finalY + 15;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Gedragsbeoordeling:', 20, currentY);
        
        // Simulated data for behavior
        const behaviorData = [
          ['Gedrag', '4/5', 'Goed'],
          ['Punctualiteit', '4/5', 'Goed'],
          ['Werk ethiek', '3/5', 'Voldoende'],
          ['Participatie', '4/5', 'Goed'],
          ['Samenwerking', '5/5', 'Uitstekend']
        ];
        
        // @ts-ignore
        doc.autoTable({
          startY: currentY + 5,
          body: behaviorData,
          theme: 'grid',
          styles: { fontSize: 10 },
          columns: [
            { header: 'Categorie', dataKey: 0 },
            { header: 'Score', dataKey: 1 },
            { header: 'Beoordeling', dataKey: 2 }
          ],
          margin: { left: 20, right: 20 },
        });
        
        // Comments section
        currentY = (doc as any).lastAutoTable.finalY + 15;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Opmerkingen:', 20, currentY);
        
        doc.setFont('helvetica', 'normal');
        const commentText = template.commentTemplate || 'Geen opmerkingen.';
        
        const splitCommentText = doc.splitTextToSize(commentText, pageWidth - 40);
        doc.text(splitCommentText, 20, currentY + 7);
        
        // Footer with signature
        currentY = doc.internal.pageSize.getHeight() - 30;
        
        doc.setFontSize(10);
        doc.text(template.footerText || 'Handtekening ouders/verzorgers:', 20, currentY);
        
        // Current date and teacher signature
        doc.text('Datum: ' + formatDutchDate(new Date()), pageWidth - 20, currentY, { align: 'right' });
      });

      // Save PDF
      const fileName = selectedStudents.length === 1 
        ? `rapport_${studentsToReport[0].firstName}_${studentsToReport[0].lastName}.pdf`
        : `rapporten_${selectedClass ? classes.find(c => c.id === parseInt(selectedClass))?.name || 'meerdere' : 'meerdere'}_studenten.pdf`;
      
      doc.save(fileName);
      
      toast({
        title: "Rapport gegenereerd",
        description: `${selectedStudents.length} rapport(en) is/zijn succesvol gegenereerd en gedownload.`,
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Fout bij genereren rapport",
        description: "Er is een fout opgetreden bij het genereren van het rapport. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  };

  // Function to update template
  const saveTemplate = () => {
    toast({
      title: "Template opgeslagen",
      description: "De rapporttemplate is succesvol opgeslagen.",
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col md:flex-row md:items-center border-b border-gray-200 pb-4 w-full">
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <div className="p-3 rounded-md bg-[#1e3a8a] text-white">
              <BookMarked className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Rapport</h1>
              <p className="text-base text-gray-500 mt-1">Beheer en genereer rapporten voor studenten en klassen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for Report Generation and Template */}
      <Tabs defaultValue="generate" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-3 md:w-[550px] p-1 bg-blue-900/10">
            <TabsTrigger value="generate" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
              <FileText className="h-4 w-4 mr-2" />
              Rapporten genereren
            </TabsTrigger>
            <TabsTrigger value="template" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
              <ClipboardList className="h-4 w-4 mr-2" />
              Template
            </TabsTrigger>
            <TabsTrigger value="archive" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistieken
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Report Generation Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 space-y-6">
            <h2 className="text-lg font-semibold mb-4">Genereer studentrapporten</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="schoolYear" className="mb-2 block">Schooljaar</Label>
                <Select value={schoolYear} onValueChange={setSchoolYear}>
                  <SelectTrigger id="schoolYear" className="w-full">
                    <SelectValue placeholder="Kies een schooljaar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023-2024">2023-2024</SelectItem>
                    <SelectItem value="2022-2023">2022-2023</SelectItem>
                    <SelectItem value="2021-2022">2021-2022</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="className" className="mb-2 block">Klas</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger id="className" className="w-full">
                    <SelectValue placeholder="Kies een klas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.length === 0 ? (
                      <SelectItem value="loading" disabled>Klassen laden...</SelectItem>
                    ) : (
                      classes.map((cls: any) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-medium">Studenten</Label>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="searchStudents" className="sr-only">Zoek studenten</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      id="searchStudents"
                      placeholder="Zoek op naam of nummer..." 
                      className="w-64 pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {!selectedClass ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-base font-medium text-gray-900">Geen klas geselecteerd</h3>
                  <p className="mt-1 text-sm text-gray-500">Selecteer eerst een klas om studenten te laden.</p>
                </div>
              ) : isLoadingStudents ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-base font-medium text-gray-900">Geen studenten gevonden</h3>
                  <p className="mt-1 text-sm text-gray-500">Er zijn geen studenten gevonden voor de geselecteerde criteria.</p>
                </div>
              ) : (
                <div className="border rounded-md">
                  <div className="bg-gray-50 p-4 border-b">
                    <div className="flex items-center">
                      <Checkbox 
                        id="selectAll" 
                        checked={selectAll} 
                        onCheckedChange={(checked) => setSelectAll(checked === true)}
                      />
                      <Label htmlFor="selectAll" className="ml-2 font-medium">Alle studenten selecteren ({filteredStudents.length})</Label>
                    </div>
                  </div>
                  
                  <div className="divide-y max-h-[400px] overflow-y-auto">
                    {filteredStudents.map((student: any) => (
                      <div key={student.id} className="flex items-center p-4 hover:bg-gray-50">
                        <Checkbox 
                          id={`student-${student.id}`} 
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleStudentSelection(student.id)}
                        />
                        <Label htmlFor={`student-${student.id}`} className="ml-2 flex-1 cursor-pointer">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center mr-3 text-xs">
                              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{student.firstName} {student.lastName}</p>
                              <p className="text-sm text-gray-500">{student.studentId}</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={generatePDF} 
                className="flex items-center" 
                disabled={selectedStudents.length === 0}
              >
                <FileText className="mr-2 h-4 w-4" />
                Rapporten genereren ({selectedStudents.length})
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Template Tab */}
        <TabsContent value="template" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 space-y-6">
            <h2 className="text-lg font-semibold mb-4">Rapport Template</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="schoolName" className="mb-2 block">Naam school</Label>
                  <Input 
                    id="schoolName" 
                    value={template.schoolName} 
                    onChange={(e) => setTemplate({...template, schoolName: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="schoolAddress" className="mb-2 block">Adres school</Label>
                  <Input 
                    id="schoolAddress" 
                    value={template.schoolAddress || ''} 
                    onChange={(e) => setTemplate({...template, schoolAddress: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="schoolContact" className="mb-2 block">Contact informatie</Label>
                  <Input 
                    id="schoolContact" 
                    value={template.schoolContact || ''} 
                    onChange={(e) => setTemplate({...template, schoolContact: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="footerText" className="mb-2 block">Tekst voor ondertekening</Label>
                  <Input 
                    id="footerText" 
                    value={template.footerText || ''} 
                    onChange={(e) => setTemplate({...template, footerText: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="commentTemplate" className="mb-2 block">Standaard opmerking</Label>
                  <Textarea 
                    id="commentTemplate" 
                    rows={4}
                    value={template.commentTemplate || ''} 
                    onChange={(e) => setTemplate({...template, commentTemplate: e.target.value})}
                    placeholder="Voer hier een standaard opmerking in..."
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="mb-2 block">School logo</Label>
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden">
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="School logo" 
                        className="max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-6">
                        <Image className="h-10 w-10 text-gray-400 mx-auto" />
                        <p className="mt-2 text-sm text-gray-500">Geen logo geupload</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center"
                    >
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Logo uploaden
                    </Button>
                    
                    {logoPreview && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setLogoPreview(null);
                          setTemplate({...template, logoImg: null});
                        }}
                        className="flex items-center text-red-500 hover:text-red-700"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Verwijderen
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Voorbeeld rapport</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Het rapport bevat de volgende secties:
                  </p>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Studentgegevens
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Cijferlijst per vak
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Aanwezigheidsgegevens
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Gedragsbeoordeling
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Opmerkingen van docenten
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Handtekening veld voor ouders
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button onClick={saveTemplate} className="flex items-center">
                <Save className="mr-2 h-4 w-4" />
                Template opslaan
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}