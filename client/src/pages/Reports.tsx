import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Calculator, History, BarChart, PlusCircle, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Reports() {
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('configure');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [reportType, setReportType] = useState('');
  const [behaviorGrades, setBehaviorGrades] = useState<{[key: number]: {grade: number, comments: string}}>({});

  // Fetch data
  const { data: students = [] } = useQuery({ queryKey: ['/api/students'] });
  const { data: classes = [] } = useQuery({ queryKey: ['/api/student-groups'] });
  const { data: courses = [] } = useQuery({ queryKey: ['/api/courses'] });

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
  };

  const generateReportData = () => {
    if (!selectedClass && !selectedStudent) return;

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('myMadrassa Rapport', 20, 30);
    doc.save('rapporten.pdf');
    
    toast({
      title: "PDF gegenereerd",
      description: "Rapporten zijn gedownload als PDF",
    });
  };

  const generatePreviewData = () => {
    if (!selectedClass && !selectedStudent) return;
    
    setActiveTab('preview');
    toast({
      title: "Voorvertoning gegenereerd",
      description: "Rapporten voorvertoning is klaar",
    });
  };

  // Filter students based on selected class
  const filteredStudents = selectedClass 
    ? (students as any[]).filter((student: any) => {
        // Find students in the selected class
        return true; // Simplified for now
      })
    : (students as any[]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center">
            <div className="mr-3 text-[#1e3a8a] bg-blue-100 rounded-lg p-2">
              <FileText className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1e3a8a]">Rapportage</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-11">
            Genereer professionele schoolrapporten met cijfers en beoordeling
          </p>
        </div>
      </div>
      
      {/* Acties onder de streep */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <Button variant="outline" className="flex items-center w-full md:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Rapporten Exporteren
        </Button>
        <Button 
          className="flex items-center w-full md:w-auto bg-primary"
          onClick={generateReportData}
          disabled={!selectedClass && !selectedStudent}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Rapport Genereren
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="configure" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <TabsList className="grid grid-cols-3 w-full md:w-[550px] p-1 bg-blue-900/10">
            <TabsTrigger value="configure" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
              <Settings className="h-4 w-4 mr-2" />
              Configuratie
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
              <Eye className="h-4 w-4 mr-2" />
              Voorvertoning
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
              <BarChart className="h-4 w-4 mr-2" />
              Analyse
            </TabsTrigger>
          </TabsList>
          
          <Button
            variant="outline"
            size="sm"
            onClick={generatePreviewData}
            disabled={!selectedClass && !selectedStudent}
            className="hidden md:flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exporteren
          </Button>
        </div>
        
        <TabsContent value="configure" className="space-y-4">
          {/* Course and assessment selector */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Select value={selectedCourse} onValueChange={handleCourseChange}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Selecteer een curriculum" />
                  </SelectTrigger>
                  <SelectContent>
                    {(courses as any[]).length === 0 ? (
                      <SelectItem value="loading" disabled>Curriculum laden...</SelectItem>
                    ) : (
                      (courses as any[]).map((course: any) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name || course.title} ({course.courseCode})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Selecteer klas" />
                  </SelectTrigger>
                  <SelectContent>
                    {(classes as any[]).map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name} ({cls.academicYear})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="Rapporttype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trimester">Trimester</SelectItem>
                      <SelectItem value="semester">Semester</SelectItem>
                      <SelectItem value="annual">Jaarrapport</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Grading table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {!selectedClass && !selectedStudent ? (
              <div className="p-8 text-center">
                <h3 className="text-gray-500 text-lg font-medium">
                  Selecteer een klas of curriculum
                </h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gedragscijfer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opmerkingen
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student: any) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                {student.firstName?.[0]}{student.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.studentId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input
                            type="number"
                            min="1"
                            max="5"
                            value={behaviorGrades[student.id]?.grade || ''}
                            onChange={(e) => {
                              const grade = parseInt(e.target.value);
                              if (grade >= 1 && grade <= 5) {
                                setBehaviorGrades(prev => ({
                                  ...prev,
                                  [student.id]: {
                                    ...prev[student.id],
                                    grade,
                                    comments: prev[student.id]?.comments || ''
                                  }
                                }));
                              }
                            }}
                            className="w-16 text-center"
                            placeholder="1-5"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input
                            type="text"
                            value={behaviorGrades[student.id]?.comments || ''}
                            onChange={(e) => {
                              setBehaviorGrades(prev => ({
                                ...prev,
                                [student.id]: {
                                  ...prev[student.id],
                                  grade: prev[student.id]?.grade || 0,
                                  comments: e.target.value
                                }
                              }));
                            }}
                            className="min-w-[200px]"
                            placeholder="Opmerking..."
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStudent(student.id.toString());
                              generatePreviewData();
                            }}
                          >
                            Rapport
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8 text-center">
              <h3 className="text-gray-500 text-lg font-medium">
                Rapport Voorvertoning
              </h3>
              <p className="text-sm text-gray-400 mt-2">
                Hier wordt de rapportvoorvertoning weergegeven
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8 text-center">
              <h3 className="text-gray-500 text-lg font-medium">
                Rapport Analyse
              </h3>
              <p className="text-sm text-gray-400 mt-2">
                Hier worden de rapport statistieken weergegeven
              </p>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}