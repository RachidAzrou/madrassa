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
  BookMarked,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define types
interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  status: string;
  programId: number;
  programName?: string;
}

interface ReportTemplate {
  id: number;
  name: string;
  type: string;
  createdDate: string;
  lastModified: string;
  sections: TemplateSection[];
}

interface TemplateSection {
  id: string;
  title: string;
  type: 'grades' | 'behavior' | 'attendance' | 'comments' | 'custom';
  content?: string;
  order: number;
}

interface ReportGeneration {
  templateId: number;
  studentIds: number[];
  periodId?: number;
  options: {
    includeBehavior: boolean;
    includeAttendance: boolean;
    includeGrades: boolean;
    includeComments: boolean;
    signature: boolean;
  };
}

export default function Reports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [options, setOptions] = useState({
    includeBehavior: true,
    includeAttendance: true,
    includeGrades: true,
    includeComments: true,
    signature: true
  });
  
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [reportPreviewUrl, setReportPreviewUrl] = useState<string | null>(null);
  const [isGeneratingReports, setIsGeneratingReports] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  
  // Fetch all students
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ['/api/students'],
    staleTime: 300000,
  });

  // Fetch students by class/student group
  const { data: classStudentsData } = useQuery<Student[]>({
    queryKey: ['/api/student-groups', selectedClass, 'students'],
    queryFn: async () => {
      if (!selectedClass) return [];
      const response = await apiRequest(`/api/student-groups/${selectedClass}/students`, {
        method: 'GET'
      });
      return response;
    },
    staleTime: 60000,
    enabled: !!selectedClass,
  });
  
  // Get all students or filtered by class
  const students = selectedClass ? (classStudentsData || []) : (studentsData || []);
  
  // Filter students based on search query
  const filteredStudents = searchQuery
    ? students.filter(student => 
        student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students;
  
  // Fetch student groups/classes for dropdown
  const { data: classesData } = useQuery<{ studentGroups: any[] }>({
    queryKey: ['/api/student-groups'],
    staleTime: 300000,
  });
  
  const classes = classesData?.studentGroups || [];
  
  // Fetch report templates
  const { data: templatesData } = useQuery<ReportTemplate[]>({
    queryKey: ['/api/report-templates'],
    staleTime: 60000,
  });
  
  const templates = templatesData || [];
  
  // Fetch academic periods
  const { data: periodsData } = useQuery({
    queryKey: ['/api/academic-periods'],
    staleTime: 300000,
  });
  
  const periods = periodsData || [];
  
  // Effect to handle selectAll changes
  useEffect(() => {
    if (selectAll) {
      setSelectedStudents(filteredStudents.map(student => student.id));
    } else {
      setSelectedStudents([]);
    }
  }, [selectAll, filteredStudents]);
  
  // Effect to update selectAll state based on individual selections
  useEffect(() => {
    if (filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedStudents, filteredStudents]);
  
  // Generate reports mutation
  const generateReportsMutation = useMutation({
    mutationFn: async (data: ReportGeneration) => {
      setIsGeneratingReports(true);
      setReportProgress(0);
      
      // Mock progress updates (in a real app, this would come from backend events)
      const progressInterval = setInterval(() => {
        setReportProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 300);
      
      try {
        const response = await apiRequest('/api/reports/generate', {
          method: 'POST',
          body: data
        });
        
        clearInterval(progressInterval);
        setReportProgress(100);
        
        return response;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      } finally {
        setTimeout(() => {
          setIsGeneratingReports(false);
          setReportProgress(0);
        }, 1000);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Rapporten gegenereerd",
        description: `${selectedStudents.length} rapport(en) succesvol gegenereerd.`,
      });
      
      // Set preview URL for the first report (if available)
      if (data && data.urls && data.urls.length > 0) {
        setReportPreviewUrl(data.urls[0]);
      }
    },
    onError: (error: any) => {
      console.error("Error generating reports:", error);
      toast({
        title: "Fout bij genereren rapporten",
        description: error.message || "Er is een fout opgetreden bij het genereren van rapporten.",
        variant: "destructive",
      });
    }
  });
  
  // Save template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async (template: ReportTemplate) => {
      if (template.id) {
        // Update existing template
        return await apiRequest(`/api/report-templates/${template.id}`, {
          method: 'PUT',
          body: template
        });
      } else {
        // Create new template
        return await apiRequest('/api/report-templates', {
          method: 'POST',
          body: template
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Template opgeslagen",
        description: "Rapporttemplate is succesvol opgeslagen.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/report-templates'] });
      setEditingTemplate(null);
    },
    onError: (error: any) => {
      console.error("Error saving template:", error);
      toast({
        title: "Fout bij opslaan template",
        description: error.message || "Er is een fout opgetreden bij het opslaan van het template.",
        variant: "destructive",
      });
    }
  });
  
  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      return await apiRequest(`/api/report-templates/${templateId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "Template verwijderd",
        description: "Rapporttemplate is succesvol verwijderd.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/report-templates'] });
    },
    onError: (error: any) => {
      console.error("Error deleting template:", error);
      toast({
        title: "Fout bij verwijderen template",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van het template.",
        variant: "destructive",
      });
    }
  });
  
  const handleToggleStudent = (studentId: number) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };
  
  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedStudents([]);
    setSelectAll(false);
  };
  
  const handleTemplateChange = (value: string) => {
    setSelectedTemplate(value);
  };
  
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
  };
  
  const handleGenerateReports = () => {
    if (!selectedTemplate) {
      toast({
        title: "Template ontbreekt",
        description: "Selecteer een rapport template om door te gaan.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedStudents.length === 0) {
      toast({
        title: "Geen studenten geselecteerd",
        description: "Selecteer minstens één student om een rapport te genereren.",
        variant: "destructive",
      });
      return;
    }
    
    const reportData: ReportGeneration = {
      templateId: parseInt(selectedTemplate),
      studentIds: selectedStudents,
      options: options
    };
    
    if (selectedPeriod) {
      reportData.periodId = parseInt(selectedPeriod);
    }
    
    generateReportsMutation.mutate(reportData);
  };
  
  const handleDownloadReports = () => {
    // In a real app, this would trigger a download from the server
    toast({
      title: "Rapporten worden gedownload",
      description: `${selectedStudents.length} rapport(en) worden gedownload als PDF.`,
    });
  };
  
  const handleCreateNewTemplate = () => {
    setEditingTemplate({
      id: 0, // New template gets 0 ID until saved
      name: "Nieuw Template",
      type: "standard",
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      sections: [
        {
          id: "section-" + Date.now(),
          title: "Cijferoverzicht",
          type: "grades",
          order: 0
        },
        {
          id: "section-" + (Date.now() + 1),
          title: "Aanwezigheid",
          type: "attendance",
          order: 1
        },
        {
          id: "section-" + (Date.now() + 2),
          title: "Gedragsbeoordeling",
          type: "behavior",
          order: 2
        },
        {
          id: "section-" + (Date.now() + 3),
          title: "Opmerkingen",
          type: "comments",
          content: "",
          order: 3
        }
      ]
    });
  };
  
  const handleEditTemplate = (template: ReportTemplate) => {
    setEditingTemplate({...template});
  };
  
  const handleDeleteTemplate = (templateId: number) => {
    if (window.confirm("Weet u zeker dat u dit template wilt verwijderen?")) {
      deleteTemplateMutation.mutate(templateId);
    }
  };
  
  const handleSaveTemplate = () => {
    if (editingTemplate) {
      saveTemplateMutation.mutate(editingTemplate);
    }
  };
  
  const handleAddSection = () => {
    if (editingTemplate) {
      const newSection: TemplateSection = {
        id: "section-" + Date.now(),
        title: "Nieuwe Sectie",
        type: "custom",
        content: "",
        order: editingTemplate.sections.length
      };
      
      setEditingTemplate({
        ...editingTemplate,
        sections: [...editingTemplate.sections, newSection],
        lastModified: new Date().toISOString()
      });
    }
  };
  
  const handleUpdateSection = (index: number, updates: Partial<TemplateSection>) => {
    if (editingTemplate) {
      const updatedSections = [...editingTemplate.sections];
      updatedSections[index] = {
        ...updatedSections[index],
        ...updates
      };
      
      setEditingTemplate({
        ...editingTemplate,
        sections: updatedSections,
        lastModified: new Date().toISOString()
      });
    }
  };
  
  const handleRemoveSection = (index: number) => {
    if (editingTemplate) {
      const updatedSections = editingTemplate.sections.filter((_, i) => i !== index);
      
      setEditingTemplate({
        ...editingTemplate,
        sections: updatedSections,
        lastModified: new Date().toISOString()
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col md:flex-row md:items-center border-b border-gray-200 pb-4 w-full">
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <div className="p-3 rounded-md bg-[#1e40af] text-white">
              <BookMarked className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Rapport</h1>
              <p className="text-base text-gray-500 mt-1">Beheer en genereer rapporten voor studenten en klassen</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0 md:ml-auto">
            <span className="text-sm text-gray-500 font-medium">
              {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="generate" value={activeTab} onValueChange={setActiveTab as any} className="w-full">
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
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="template" className="text-sm font-medium">Rapport template</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                      <SelectTrigger id="template" className="mt-1">
                        <SelectValue placeholder="Selecteer een template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="period" className="text-sm font-medium">Academische periode</Label>
                    <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                      <SelectTrigger id="period" className="mt-1">
                        <SelectValue placeholder="Selecteer een periode" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map((period: any) => (
                          <SelectItem key={period.id} value={period.id.toString()}>
                            {period.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="class" className="text-sm font-medium">Klas filter</Label>
                    <Select value={selectedClass} onValueChange={handleClassChange}>
                      <SelectTrigger id="class" className="mt-1">
                        <SelectValue placeholder="Alle studenten" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Alle studenten</SelectItem>
                        {classes.map((cls: any) => (
                          <SelectItem key={cls.id} value={cls.id.toString()}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-6 space-y-4">
                  <h3 className="text-md font-medium">Rapport onderdelen</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeGrades" 
                        checked={options.includeGrades}
                        onCheckedChange={(checked) => setOptions({...options, includeGrades: checked === true})}
                      />
                      <Label htmlFor="includeGrades">Cijfers en resultaten</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeBehavior" 
                        checked={options.includeBehavior}
                        onCheckedChange={(checked) => setOptions({...options, includeBehavior: checked === true})}
                      />
                      <Label htmlFor="includeBehavior">Gedragsbeoordeling</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeAttendance" 
                        checked={options.includeAttendance}
                        onCheckedChange={(checked) => setOptions({...options, includeAttendance: checked === true})}
                      />
                      <Label htmlFor="includeAttendance">Aanwezigheidsgegevens</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeComments" 
                        checked={options.includeComments}
                        onCheckedChange={(checked) => setOptions({...options, includeComments: checked === true})}
                      />
                      <Label htmlFor="includeComments">Opmerkingen en feedback</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="signature" 
                        checked={options.signature}
                        onCheckedChange={(checked) => setOptions({...options, signature: checked === true})}
                      />
                      <Label htmlFor="signature">Inclusief handtekening docent</Label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col h-full space-y-4">
                <div>
                  <Label htmlFor="search" className="sr-only">Zoek studenten</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="search"
                      type="search"
                      placeholder="Zoek studenten..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="border rounded-lg flex-grow overflow-hidden">
                  <div className="flex items-center px-4 py-3 bg-gray-50 border-b">
                    <div className="flex items-center">
                      <Checkbox 
                        id="selectAll" 
                        checked={selectAll} 
                        onCheckedChange={(checked) => setSelectAll(checked === true)}
                      />
                      <Label htmlFor="selectAll" className="ml-2 font-medium">Alle studenten selecteren</Label>
                    </div>
                    <Badge className="ml-3" variant="secondary">{filteredStudents.length}</Badge>
                  </div>
                  
                  <div className="overflow-y-auto max-h-[350px]">
                    {isLoadingStudents ? (
                      <div className="flex justify-center py-12">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-base font-medium text-gray-900">Geen studenten gevonden</h3>
                        <p className="mt-1 text-sm text-gray-500">Er zijn geen studenten gevonden voor de geselecteerde criteria.</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {filteredStudents.map(student => (
                          <div key={student.id} className="flex items-center px-4 py-3 hover:bg-gray-50">
                            <Checkbox 
                              id={`student-${student.id}`} 
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={() => handleToggleStudent(student.id)}
                            />
                            <div className="ml-3 flex-grow">
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`student-${student.id}`} className="font-medium cursor-pointer">
                                  {student.firstName} {student.lastName}
                                </Label>
                                <Badge variant="outline">{student.studentId}</Badge>
                              </div>
                              <div className="text-sm text-gray-500 flex gap-2">
                                {student.programName && (
                                  <span>{student.programName}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadReports}
                    disabled={selectedStudents.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Rapporten downloaden
                  </Button>
                  <Button 
                    onClick={handleGenerateReports}
                    disabled={selectedStudents.length === 0 || !selectedTemplate || isGeneratingReports}
                    className="bg-[#1e40af] hover:bg-[#1e40af]/90"
                  >
                    {isGeneratingReports ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent"></div>
                        Bezig met genereren...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Rapporten genereren
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Template Tab */}
        <TabsContent value="template" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Rapport templates</h2>
              <Button 
                onClick={handleCreateNewTemplate}
                className="bg-[#1e40af] hover:bg-[#1e40af]/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nieuw template
              </Button>
            </div>
            
            {editingTemplate ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="template-name" className="text-sm font-medium">Template naam</Label>
                    <Input
                      id="template-name"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-type" className="text-sm font-medium">Type rapport</Label>
                    <Select 
                      value={editingTemplate.type}
                      onValueChange={(value) => setEditingTemplate({...editingTemplate, type: value})}
                    >
                      <SelectTrigger id="template-type" className="mt-1">
                        <SelectValue placeholder="Selecteer type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standaard rapport</SelectItem>
                        <SelectItem value="midterm">Tussentijds rapport</SelectItem>
                        <SelectItem value="final">Eindrapport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Secties</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddSection}
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Sectie toevoegen
                    </Button>
                  </div>
                  
                  {editingTemplate.sections.map((section, index) => (
                    <div key={section.id} className="mb-4 p-4 border rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <Input
                          value={section.title}
                          onChange={(e) => handleUpdateSection(index, { title: e.target.value })}
                          className="font-medium border-0 p-0 h-auto text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <button
                          onClick={() => handleRemoveSection(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="mb-3">
                        <Label htmlFor={`section-type-${index}`} className="text-sm font-medium">Type sectie</Label>
                        <Select 
                          value={section.type}
                          onValueChange={(value) => handleUpdateSection(index, { type: value as any })}
                        >
                          <SelectTrigger id={`section-type-${index}`} className="mt-1">
                            <SelectValue placeholder="Selecteer type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grades">Cijferoverzicht</SelectItem>
                            <SelectItem value="behavior">Gedragsbeoordeling</SelectItem>
                            <SelectItem value="attendance">Aanwezigheid</SelectItem>
                            <SelectItem value="comments">Opmerkingen</SelectItem>
                            <SelectItem value="custom">Aangepast</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {(section.type === 'comments' || section.type === 'custom') && (
                        <div>
                          <Label htmlFor={`section-content-${index}`} className="text-sm font-medium">Inhoud</Label>
                          <Textarea
                            id={`section-content-${index}`}
                            value={section.content || ''}
                            onChange={(e) => handleUpdateSection(index, { content: e.target.value })}
                            rows={4}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setEditingTemplate(null)}
                  >
                    Annuleren
                  </Button>
                  <Button
                    onClick={handleSaveTemplate}
                    disabled={saveTemplateMutation.isPending}
                    className="bg-[#1e40af] hover:bg-[#1e40af]/90"
                  >
                    {saveTemplateMutation.isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent"></div>
                        Opslaan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Template opslaan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {templates.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-base font-medium text-gray-900">Geen templates gevonden</h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                      Er zijn nog geen rapport templates aangemaakt. Maak een nieuw template om te beginnen.
                    </p>
                    <Button 
                      onClick={handleCreateNewTemplate}
                      className="mt-4 bg-[#1e40af] hover:bg-[#1e40af]/90"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Nieuw template aanmaken
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(template => (
                      <Card key={template.id} className="border shadow-sm">
                        <CardHeader className="pb-2 pt-4">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline">{template.type}</Badge>
                            <Badge variant="secondary" className="text-xs">
                              {template.sections.length} secties
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-500 pt-2">
                          <p>Gemaakt: {new Date(template.createdDate).toLocaleDateString('nl-NL')}</p>
                          <p>Laatst bewerkt: {new Date(template.lastModified).toLocaleDateString('nl-NL')}</p>
                        </CardContent>
                        <CardContent className="pt-0">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                              className="flex-1"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Bewerken
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Verwijderen
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Archive/Statistics Tab */}
        <TabsContent value="archive" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-6">Rapport statistieken en analyses</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Totaal aantal rapporten</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">143</div>
                  <p className="text-xs text-gray-500 mt-1">Dit academisch jaar</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Gegenereerd deze maand</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">38</div>
                  <p className="text-xs text-gray-500 mt-1">Vorige maand: 65</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Populairste template</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">Standaard rapport</div>
                  <p className="text-xs text-gray-500 mt-1">76% van alle rapporten</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="rounded-lg border bg-gray-50 p-8 text-center">
              <BarChart className="h-16 w-16 text-gray-300 mx-auto" />
              <h3 className="mt-4 text-lg font-medium">Geavanceerde statistieken binnenkort beschikbaar</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                Gedetailleerde rapportagestatistieken en analyses zullen binnenkort beschikbaar zijn in een toekomstige update.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}