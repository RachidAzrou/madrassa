import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, ChevronDown, ChevronUp, Edit, Trash2, Clock, Users, Calendar, BookOpen, Building, BookText, XCircle, GraduationCap, X, Pencil, Info, Eye, Target, Award } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

// Custom ChalkBoard icoon
const ChalkBoard = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="14" rx="2" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="6" y1="12" x2="6" y2="20" />
    <line x1="18" y1="12" x2="18" y2="20" />
    <ellipse cx="12" cy="18" rx="3" ry="2" />
    <path d="M10 4h4" />
    <path d="M8 8h8" />
  </svg>
);
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTableContainer, SearchActionBar, QuickActions } from '@/components/ui/data-table-container';
import { 
  StandardTable, 
  StandardTableHeader, 
  StandardTableBody, 
  StandardTableRow, 
  StandardTableHeaderCell, 
  StandardTableCell,
  TableLoadingState,
  TableErrorState,
  TableEmptyState,
  EmptyActionHeader
} from '@/components/ui/standard-table';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CustomDialog,
  DialogHeaderWithIcon,
  DialogFormContainer,
  SectionContainer,
  DialogFooterContainer,
  FormLabel,
  StyledSelect,
  StyledSelectItem,
  StyledCheckbox
} from '@/components/ui/custom-dialog';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { PremiumHeader } from '@/components/layout/premium-header';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from "@/components/ui/textarea";


interface Program {
  id: number;
  name: string;
  code: string;
  department: string;
  description: string;
  duration: number;
  isActive: boolean;
  // Optionele velden die mogelijk niet uit de API komen
  totalCredits?: number;
  students?: number;
  startDate?: string;
  courses?: {
    id: string;
    name: string;
    code: string;
    credits: number;
    semester: number;
  }[];
}

export default function Programs() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProgram, setExpandedProgram] = useState<number | null>(null);
  
  // State voor vak dialogen
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedPrograms, setSelectedPrograms] = useState<Set<number>>(new Set());
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    program: Program | null;
  }>({ isOpen: false, program: null });
  
  // State voor actieve tabs
  const [activeTab, setActiveTab] = useState('general');
  const [editActiveTab, setEditActiveTab] = useState('general');
  const [viewActiveTab, setViewActiveTab] = useState('general');
  const [programFormData, setProgramFormData] = useState({
    name: '',
    code: '',
    description: '',
    duration: 4,
    department: '',
    isActive: true,
    entryRequirements: '',
    learningObjectives: '',
    competencies: '',
    assignedClasses: [] as { id: string; name: string; selected: boolean }[],
    assignedTeachers: [] as { id: string; name: string; selected: boolean }[],
  });

  // Fetch programs
  const { data, isLoading, isError } = useQuery<Program[] | { programs: Program[] }>({
    queryKey: ['/api/programs', { searchTerm }],
    staleTime: 30000,
  });

  // Fetch klassen en docenten voor het vak formulier
  const { data: classesData } = useQuery({
    queryKey: ['/api/student-groups'],
    staleTime: 30000,
  });

  const { data: teachersData } = useQuery({
    queryKey: ['/api/teachers'],
    staleTime: 30000,
  });

  console.log('Fetched teachers:', teachersData);

  // Als data direct een array is, gebruik het; anders zoek naar data.programs
  const programs = Array.isArray(data) ? data : data?.programs || [];

  // Haal beschikbare docenten op uit de database
  const getAvailableTeachers = () => {
    const apiTeachers = teachersData?.teachers || [];
    
    // Filter API docenten op zoekterm
    return apiTeachers.filter((teacher: any) => 
      teacher.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Haal beschikbare klassen op uit de database
  const getAvailableClasses = () => {
    const apiClasses = Array.isArray(classesData) ? classesData : [];
    
    return apiClasses.map((studentGroup: any) => ({
      id: studentGroup.id.toString(),
      name: `${studentGroup.name} (${studentGroup.academicYear})`,
      selected: false
    }));
  };

  const availableTeachers = getAvailableTeachers();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const toggleExpand = (programId: number) => {
    if (expandedProgram === programId) {
      setExpandedProgram(null);
    } else {
      setExpandedProgram(programId);
    }
  };

  // Verbeterde mutatie om een programma toe te voegen
  const createProgramMutation = useMutation({
    mutationFn: async (programData: typeof programFormData) => {
      try {
        return await apiRequest('/api/programs', {
          method: 'POST',
          body: programData
        });
      } catch (error: any) {
        console.error('Error creating program:', error);
        throw new Error(error?.message || 'Fout bij het aanmaken van het programma');
      }
    },
    onSuccess: () => {
      // Invalideer relevante queries
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      // Reset form en sluit dialoog
      setProgramFormData({
        name: '',
        code: '',
        description: '',
        duration: 4,
        department: '',
        isActive: true,
        entryRequirements: '',
        learningObjectives: '',
        competencies: '',
        assignedClasses: [],
        assignedTeachers: [],
      });
      setIsAddDialogOpen(false);
      
      // Toon succes melding
      toast({
        title: "Programma toegevoegd",
        description: "Het programma is succesvol toegevoegd aan het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error('Error creating program:', error);
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van het programma. Controleer of de code uniek is en alle verplichte velden correct zijn ingevuld.",
        variant: "destructive",
      });
    }
  });

  const handleAddProgram = () => {
    // Open het toevoeg-dialoogvenster
    setIsAddDialogOpen(true);
  };
  
  const handleSubmitProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    createProgramMutation.mutate(programFormData);
  };
  

  
  // Verbeterde mutatie voor het bijwerken van een programma
  const updateProgramMutation = useMutation({
    mutationFn: async (data: { id: number; programData: typeof programFormData }) => {
      try {
        return await apiRequest(`/api/programs/${data.id}`, {
          method: 'PUT',
          body: data.programData
        });
      } catch (error: any) {
        console.error('Error updating program:', error);
        throw new Error(error?.message || 'Fout bij het bijwerken van het programma');
      }
    },
    onSuccess: () => {
      // Invalideer relevante queries
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      // Reset UI-state
      setIsEditDialogOpen(false);
      setSelectedProgram(null);
      
      // Toon succes melding
      toast({
        title: "Programma bijgewerkt",
        description: "Het programma is succesvol bijgewerkt in het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error('Error updating program:', error);
      toast({
        title: "Fout bij bijwerken",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van het programma. Controleer of alle verplichte velden correct zijn ingevuld.",
        variant: "destructive",
      });
    }
  });

  const handleSubmitEditProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProgram) {
      updateProgramMutation.mutate({
        id: selectedProgram.id,
        programData: programFormData
      });
    }
  };

  const handleViewProgram = (id: number) => {
    const program = programs.find(p => p.id === id);
    if (program) {
      setSelectedProgram(program);
      setIsViewDialogOpen(true);
    }
  };

  const handleEditProgram = (id: number) => {
    const program = programs.find(p => p.id === id);
    if (program) {
      setSelectedProgram(program);
      // Vul het formulier met de geselecteerde programma gegevens
      setProgramFormData({
        name: program.name,
        code: program.code,
        description: program.description || '',
        duration: program.duration,
        department: program.department || '',
        isActive: program.isActive,
        entryRequirements: program.entryRequirements || '',
        learningObjectives: program.learningObjectives || '',
        competencies: program.competencies || '',
        assignedClasses: getAvailableClasses(),
        assignedTeachers: availableTeachers.map(teacher => ({
          id: teacher.id.toString(),
          name: `${teacher.firstName} ${teacher.lastName}`,
          selected: false
        })),
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleDeleteProgram = (id: number) => {
    const program = programs.find(p => p.id === id);
    if (program) {
      setSelectedProgram(program);
      setIsDeleteDialogOpen(true);
    }
  };

  // Delete mutation voor het verwijderen van een programma
  const deleteProgramMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/programs/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      // Invalideer relevante queries
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      // Reset UI-state
      setDeleteConfirmation({ isOpen: false, program: null });
      
      // Toon succes melding
      toast({
        title: "Vak verwijderd",
        description: "Het vak is succesvol verwijderd uit het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting program:', error);
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van het vak.",
        variant: "destructive",
      });
      setDeleteConfirmation({ isOpen: false, program: null });
    }
  });

  const confirmDeleteProgram = () => {
    if (selectedProgram) {
      deleteProgramMutation.mutate(selectedProgram.id);
    }
  };

  const handleClassSelection = (classId: string, selected: boolean) => {
    setProgramFormData(prev => {
      const updatedClasses = prev.assignedClasses.map(c => 
        c.id === classId ? { ...c, selected } : c
      );
      return { ...prev, assignedClasses: updatedClasses };
    });
  };

  const handleTeacherSelection = (teacherId: string, selected: boolean) => {
    setProgramFormData(prev => {
      // Check if teacher is already in assignedTeachers array
      const existingTeacherIndex = prev.assignedTeachers.findIndex(t => t.id === teacherId);
      
      if (existingTeacherIndex >= 0) {
        // Update existing teacher
        const updatedTeachers = prev.assignedTeachers.map(t => 
          t.id === teacherId ? { ...t, selected } : t
        );
        return { ...prev, assignedTeachers: updatedTeachers };
      } else if (selected) {
        // Add new teacher to the array
        const newTeacher = { id: teacherId, selected: true };
        return { 
          ...prev, 
          assignedTeachers: [...prev.assignedTeachers, newTeacher] 
        };
      }
      
      // If not selected and not in array, do nothing
      return prev;
    });
  };

  // Selectie handlers voor vakken
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPrograms(new Set(programs.map((p: any) => p.id)));
    } else {
      setSelectedPrograms(new Set());
    }
  };

  const handleSelectProgram = (programId: number, checked: boolean) => {
    setSelectedPrograms(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(programId);
      } else {
        newSet.delete(programId);
      }
      return newSet;
    });
  };

  const isAllSelected = programs.length > 0 && selectedPrograms.size === programs.length;
  const isIndeterminate = selectedPrograms.size > 0 && selectedPrograms.size < programs.length;

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="fixed top-0 left-64 right-0 z-30">
        <PremiumHeader 
          title="Vakken" 
          path="Evaluatie > Vakken" 
          icon={BookText}
          description="Beheer alle vakken binnen het curriculum, inclusief toewijzing aan docenten en klassen"
        />
      </div>
      <div className="mt-[115px] flex-1 overflow-auto bg-gray-50">
      
      {/* Main content area */}
      <div className="px-6 py-6 flex-1 space-y-6">
        {/* Search and action bar */}
        <SearchActionBar>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Zoek vakken..."
              className="pl-9 h-8 text-xs bg-white rounded-sm border-[#e5e7eb]"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="flex gap-2 items-center">
            <Button
              onClick={() => {
                console.log('Vak Toevoegen knop geklikt');
                setIsAddDialogOpen(true);
              }}
              size="sm"
              className="h-7 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              Vak Toevoegen
            </Button>
          </div>
        </SearchActionBar>
        {/* Programs table */}
        <StandardTable>
          <StandardTableHeader>
            <tr>
              <StandardTableHeaderCell className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  className="mx-auto data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-gray-300"
                />
              </StandardTableHeaderCell>
              <StandardTableHeaderCell>Vaknaam</StandardTableHeaderCell>
              <StandardTableHeaderCell>Code</StandardTableHeaderCell>
              <StandardTableHeaderCell>Docent</StandardTableHeaderCell>
              <StandardTableHeaderCell>Duur</StandardTableHeaderCell>
              <StandardTableHeaderCell>Status</StandardTableHeaderCell>
              <EmptyActionHeader />
            </tr>
          </StandardTableHeader>
          <StandardTableBody>
            {isLoading ? (
              <TableLoadingState colSpan={7} message="Vakken laden..." />
            ) : isError ? (
              <TableErrorState 
                colSpan={7} 
                message="Er is een fout opgetreden bij het laden van de vakken."
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['/api/programs'] })}
              />
            ) : programs.length === 0 ? (
              <TableEmptyState
                colSpan={7}
                icon={<BookText className="h-12 w-12 mx-auto text-gray-300" />}
                title="Geen vakken gevonden"
                description={searchTerm 
                  ? "Geen vakken komen overeen met uw zoekcriteria."
                  : "Er zijn nog geen vakken aangemaakt."}
              />
            ) : (
              programs.map((program: Program) => (
                <StandardTableRow key={program.id} className="group">
                  <StandardTableCell className="w-12">
                    <Checkbox
                      checked={selectedPrograms.has(program.id)}
                      onCheckedChange={(checked) => handleSelectProgram(program.id, checked as boolean)}
                      className="mx-auto data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 border-gray-300"
                    />
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium text-gray-900">{program.name}</div>
                        <div className="text-gray-500">{program.description}</div>
                      </div>
                    </div>
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap">
                    <span className="bg-primary/10 text-primary font-medium px-2.5 py-0.5 rounded">
                      {program.code}
                    </span>
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap">
                    <span className="text-gray-900">Nog niet toegewezen</span>
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap">
                    <span className="text-gray-900">
                      {program.duration === 1 ? '1 Jaar' : 
                       program.duration === 2 ? '1 Semester' : 
                       program.duration === 3 ? '1 Trimester' : 
                       `${program.duration} Maanden`}
                    </span>
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap">
                    <span className={`px-2 py-1 font-medium rounded-full ${
                      program.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {program.isActive ? 'Actief' : 'Inactief'}
                    </span>
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => handleViewProgram(program.id)}
                        title="Bekijken"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => handleEditProgram(program.id)}
                        title="Bewerken"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteConfirmation({ isOpen: true, program })}
                        title="Verwijderen"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </StandardTableCell>
                </StandardTableRow>
              ))
            )}
          </StandardTableBody>
        </StandardTable>
      </div>
      
      {/* Nieuw vak dialoogvenster */}
      <CustomDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} maxWidth="600px">
        <DialogHeaderWithIcon
          title="Nieuw Vak Toevoegen"
          description="Vul de onderstaande gegevens in om een nieuw vak toe te voegen."
          icon={<BookText className="h-5 w-5" />}
        />
        
        <form onSubmit={handleSubmitProgram}>
          <div className="p-6 pt-4">
            <Tabs defaultValue="algemeen" className="mt-4">
              <TabsList className="mb-4">
                <TabsTrigger value="algemeen">Algemene informatie</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="docenten">Docenten</TabsTrigger>
                <TabsTrigger value="klassen">Klassen</TabsTrigger>
              </TabsList>
              
              <TabsContent value="algemeen" className="mt-0">
                <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FormLabel htmlFor="name">
                        Naam vak <span className="text-red-500">*</span>
                      </FormLabel>
                      <Input
                        id="name"
                        value={programFormData.name}
                        onChange={(e) => setProgramFormData({ ...programFormData, name: e.target.value })}
                        className="h-9 text-sm"
                        placeholder="Voer vaknaam in"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <FormLabel htmlFor="code">
                        Code <span className="text-red-500">*</span>
                      </FormLabel>
                      <Input
                        id="code"
                        value={programFormData.code}
                        onChange={(e) => setProgramFormData({ ...programFormData, code: e.target.value })}
                        className="h-9 text-sm"
                        placeholder="Voer vakcode in"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <FormLabel htmlFor="duration">Duur</FormLabel>
                      <StyledSelect
                        value={programFormData.duration.toString()}
                        onValueChange={(value) => setProgramFormData({ ...programFormData, duration: parseInt(value) })}
                        placeholder="Selecteer duur"
                      >
                        <StyledSelectItem value="1">Jaar</StyledSelectItem>
                        <StyledSelectItem value="2">Semester</StyledSelectItem>
                        <StyledSelectItem value="3">Trimester</StyledSelectItem>
                      </StyledSelect>
                    </div>
                    
                    <div className="space-y-2">
                      <FormLabel htmlFor="status">Status</FormLabel>
                      <StyledSelect
                        value={programFormData.isActive ? "true" : "false"}
                        onValueChange={(value) => setProgramFormData({ ...programFormData, isActive: value === "true" })}
                        placeholder="Selecteer status"
                      >
                        <StyledSelectItem value="true">Actief</StyledSelectItem>
                        <StyledSelectItem value="false">Inactief</StyledSelectItem>
                      </StyledSelect>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="description">Beschrijving</FormLabel>
                    <Textarea
                      id="description"
                      value={programFormData.description || ""}
                      onChange={(e) => setProgramFormData({ ...programFormData, description: e.target.value })}
                      className="min-h-[100px] resize-none text-sm"
                      placeholder="Geef een beschrijving van het vak..."
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="curriculum" className="mt-0">
                <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                  <div className="space-y-2">
                    <FormLabel htmlFor="instroomvereisten">Instroomvereisten</FormLabel>
                    <Textarea
                      id="instroomvereisten"
                      value={programFormData.entryRequirements}
                      onChange={(e) => setProgramFormData(prev => ({ ...prev, entryRequirements: e.target.value }))}
                      className="min-h-[100px] resize-none text-sm"
                      placeholder="Beschrijf de instroomvereisten..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <FormLabel htmlFor="leerdoelen">Leerdoelen</FormLabel>
                    <Textarea
                      id="leerdoelen"
                      value={programFormData.learningObjectives}
                      onChange={(e) => setProgramFormData(prev => ({ ...prev, learningObjectives: e.target.value }))}
                      className="min-h-[100px] resize-none text-sm"
                      placeholder="Beschrijf de leerdoelen van dit vak..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <FormLabel htmlFor="competenties">Competenties</FormLabel>
                    <Textarea
                      id="competenties"
                      value={programFormData.competencies}
                      onChange={(e) => setProgramFormData(prev => ({ ...prev, competencies: e.target.value }))}
                      className="min-h-[100px] resize-none text-sm"
                      placeholder="Lijst van competenties die studenten ontwikkelen..."
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="docenten" className="mt-0">
                <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-between">
                    <FormLabel>Toegewezen docenten</FormLabel>
                    <span className="text-xs text-gray-500">
                      {programFormData.assignedTeachers.filter(t => t.selected).length} geselecteerd
                    </span>
                  </div>
                  
                  {/* Zoekbalk voor docenten */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Zoek docenten..."
                        className="pl-10 h-9 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Refresh docenten data
                        queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
                      }}
                      className="h-9 px-3"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="border border-gray-200 bg-white rounded-md p-4 max-h-[300px] overflow-auto">
                    {availableTeachers && availableTeachers.length > 0 ? (
                      <div className="space-y-3">
                        {availableTeachers.map((teacher: any) => {
                          const isSelected = programFormData.assignedTeachers.find(t => t.id === teacher.id)?.selected || false;
                          return (
                            <div key={teacher.id} className={`flex items-center space-x-3 py-3 px-3 rounded-md border transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' 
                                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                            onClick={() => handleTeacherSelection(teacher.id, !isSelected)}
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-blue-600 border-blue-600' 
                                  : 'border-gray-300 bg-white'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-xs font-semibold text-blue-600">
                                      {teacher.firstName?.charAt(0) || 'D'}{teacher.lastName?.charAt(0) || 'T'}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {teacher.firstName} {teacher.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {teacher.email || 'Geen email beschikbaar'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              {teacher.specialty && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    {teacher.specialty}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm font-medium">Geen docenten gevonden</p>
                        <p className="text-xs mt-1">Probeer een andere zoekterm of voeg docenten toe</p>
                      </div>
                    )}
                  </div>
                  
                  {programFormData.assignedTeachers.filter(t => t.selected).length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-blue-900">Geselecteerde docenten</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setProgramFormData(prev => ({
                              ...prev,
                              assignedTeachers: prev.assignedTeachers.map(t => ({ ...t, selected: false }))
                            }));
                          }}
                          className="h-7 px-2 text-xs"
                        >
                          Alles deselecteren
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {programFormData.assignedTeachers
                          .filter(t => t.selected)
                          .map(assignedTeacher => {
                            const teacher = availableTeachers.find((t: any) => t.id === assignedTeacher.id);
                            return teacher ? (
                              <div key={teacher.id} className="flex items-center gap-3 bg-white border border-blue-300 rounded-md p-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-xs font-semibold text-blue-600">
                                    {teacher.firstName?.charAt(0) || 'D'}{teacher.lastName?.charAt(0) || 'T'}
                                  </span>
                                </div>
                                <div className="flex-grow">
                                  <p className="text-sm font-medium text-blue-900">
                                    {teacher.firstName} {teacher.lastName}
                                  </p>
                                  <p className="text-xs text-blue-600">
                                    {teacher.email || 'Geen email'}
                                  </p>
                                </div>
                                {teacher.specialty && (
                                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    {teacher.specialty}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTeacherSelection(teacher.id, false);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded p-1"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : null;
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="klassen" className="mt-0">
                <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                  <div className="space-y-2">
                    <FormLabel className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Klassen toewijzen
                    </FormLabel>
                    <div className="bg-white border border-gray-200 rounded-md p-4 max-h-60 overflow-y-auto">
                      {getAvailableClasses().length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {getAvailableClasses().map((studentGroup) => (
                            <div key={studentGroup.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`add-class-${studentGroup.id}`}
                                checked={programFormData.assignedClasses.find(c => c.id === studentGroup.id)?.selected || false}
                                onCheckedChange={(checked) => {
                                  setProgramFormData(prev => ({
                                    ...prev,
                                    assignedClasses: prev.assignedClasses.map(c => 
                                      c.id === studentGroup.id ? { ...c, selected: checked as boolean } : c
                                    )
                                  }));
                                }}
                              />
                              <FormLabel htmlFor={`add-class-${studentGroup.id}`} className="text-sm">
                                {studentGroup.name}
                              </FormLabel>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Geen klassen beschikbaar</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </form>
        
        <DialogFooterContainer
          onCancel={() => setIsAddDialogOpen(false)}
          onSubmit={(e) => {
            e.preventDefault();
            console.log('Vak toevoegen submit clicked', programFormData);
            
            // Validatie
            if (!programFormData.name || !programFormData.code) {
              toast({
                title: "Validatiefout",
                description: "Vul alle verplichte velden in.",
                variant: "destructive",
              });
              return;
            }
            
            // Trigger de mutation om het programma op te slaan
            createProgramMutation.mutate(programFormData);
          }}
          cancelText="Annuleren"
          submitText="Vak toevoegen"
        />
      </CustomDialog>
      
      {/* Vak bewerken dialoogvenster */}
      <CustomDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} maxWidth="600px">
        <DialogHeaderWithIcon
          title="Vak Bewerken"
          description="Bewerk de gegevens van het geselecteerde vak."
          icon={<Pencil className="h-5 w-5" />}
        />
        
        <DialogFormContainer
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedProgram) {
              updateProgramMutation.mutate({
                id: selectedProgram.id,
                programData: programFormData
              });
            }
          }}
        >
          <Tabs value={editActiveTab} onValueChange={setEditActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="general">Algemeen</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="teachers">Docenten</TabsTrigger>
              <TabsTrigger value="classes">Klassen</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel>Naam vak *</FormLabel>
                  <input
                    type="text"
                    value={programFormData.name}
                    onChange={(e) => setProgramFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <FormLabel>Code *</FormLabel>
                  <input
                    type="text"
                    value={programFormData.code}
                    onChange={(e) => setProgramFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <FormLabel>Duur *</FormLabel>
                  <Select value={programFormData.duration.toString()} onValueChange={(value) => setProgramFormData(prev => ({ ...prev, duration: parseInt(value) }))}>
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="Selecteer duur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Jaar</SelectItem>
                      <SelectItem value="2">Semester</SelectItem>
                      <SelectItem value="3">Trimester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <FormLabel>Departement</FormLabel>
                  <input
                    type="text"
                    value={programFormData.department}
                    onChange={(e) => setProgramFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-is-active"
                      checked={programFormData.isActive}
                      onCheckedChange={(checked) => setProgramFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                    />
                    <FormLabel htmlFor="edit-is-active">Actief programma</FormLabel>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <FormLabel>Beschrijving</FormLabel>
                <textarea
                  value={programFormData.description}
                  onChange={(e) => setProgramFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Voer een beschrijving in..."
                />
              </div>
            </TabsContent>

            <TabsContent value="curriculum" className="mt-0">
              <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                <div className="space-y-2">
                  <FormLabel htmlFor="edit-instroomvereisten">Instroomvereisten</FormLabel>
                  <Textarea
                    id="edit-instroomvereisten"
                    value={programFormData.entryRequirements}
                    onChange={(e) => setProgramFormData(prev => ({ ...prev, entryRequirements: e.target.value }))}
                    className="min-h-[100px] resize-none text-sm"
                    placeholder="Beschrijf de instroomvereisten..."
                  />
                </div>
                
                <div className="space-y-2">
                  <FormLabel htmlFor="edit-leerdoelen">Leerdoelen</FormLabel>
                  <Textarea
                    id="edit-leerdoelen"
                    value={programFormData.learningObjectives}
                    onChange={(e) => setProgramFormData(prev => ({ ...prev, learningObjectives: e.target.value }))}
                    className="min-h-[100px] resize-none text-sm"
                    placeholder="Beschrijf de leerdoelen van dit vak..."
                  />
                </div>
                
                <div className="space-y-2">
                  <FormLabel htmlFor="edit-competenties">Competenties</FormLabel>
                  <Textarea
                    id="edit-competenties"
                    value={programFormData.competencies}
                    onChange={(e) => setProgramFormData(prev => ({ ...prev, competencies: e.target.value }))}
                    className="min-h-[100px] resize-none text-sm"
                    placeholder="Lijst van competenties die studenten ontwikkelen..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="teachers" className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <FormLabel className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Docenten toewijzen
                </FormLabel>
                <div className="bg-white border border-gray-200 rounded-md p-4 max-h-60 overflow-y-auto">
                  {programFormData.assignedTeachers && programFormData.assignedTeachers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {programFormData.assignedTeachers.map((teacher) => (
                        <div key={teacher.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-teacher-${teacher.id}`}
                            checked={teacher.selected}
                            onCheckedChange={(checked) => {
                              setProgramFormData(prev => ({
                                ...prev,
                                assignedTeachers: prev.assignedTeachers.map(t => 
                                  t.id === teacher.id ? { ...t, selected: checked as boolean } : t
                                )
                              }));
                            }}
                          />
                          <FormLabel htmlFor={`edit-teacher-${teacher.id}`} className="text-sm">
                            {teacher.name}
                          </FormLabel>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Geen docenten beschikbaar</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="classes" className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <FormLabel className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Klassen toewijzen
                </FormLabel>
                <div className="bg-white border border-gray-200 rounded-md p-4 max-h-60 overflow-y-auto">
                  {programFormData.assignedClasses && programFormData.assignedClasses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {programFormData.assignedClasses.map((studentGroup) => (
                        <div key={studentGroup.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-class-${studentGroup.id}`}
                            checked={studentGroup.selected}
                            onCheckedChange={(checked) => {
                              setProgramFormData(prev => ({
                                ...prev,
                                assignedClasses: prev.assignedClasses.map(c => 
                                  c.id === studentGroup.id ? { ...c, selected: checked as boolean } : c
                                )
                              }));
                            }}
                          />
                          <FormLabel htmlFor={`edit-class-${studentGroup.id}`} className="text-sm">
                            {studentGroup.name}
                          </FormLabel>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Geen klassen beschikbaar</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogFormContainer>

        <DialogFooterContainer
          onCancel={() => setIsEditDialogOpen(false)}
          onSubmit={() => {
            if (selectedProgram) {
              updateProgramMutation.mutate({
                id: selectedProgram.id,
                programData: programFormData
              });
            }
          }}
          cancelText="Annuleren"
          submitText={updateProgramMutation.isPending ? 'Bijwerken...' : 'Vak bijwerken'}
        />
      </CustomDialog>
      {/* Vak verwijderen dialoogvenster */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Vak Verwijderen"
        description="Ben je zeker dat je dit vak wilt verwijderen?"
        item={{
          name: selectedProgram?.name || '',
          id: selectedProgram?.code || '',
          initials: selectedProgram?.code ? selectedProgram.code.substring(0, 2).toUpperCase() : 'VK'
        }}
        onConfirm={() => {
          if (selectedProgram) {
            deleteProgramMutation.mutate(selectedProgram.id);
          }
        }}
        confirmButtonText="Verwijderen"
        cancelButtonText="Annuleren"
        isLoading={deleteProgramMutation.isPending}
      />

      {/* Vak bekijken dialoogvenster */}
      <CustomDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} maxWidth="1200px">
        <DialogHeaderWithIcon
          title="Vak Details"
          description="Bekijk alle informatie van het geselecteerde vak"
          icon={<Eye className="h-5 w-5" />}
        />
        
        {selectedProgram && (
          <DialogFormContainer className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Algemene Informatie */}
              <SectionContainer 
                title="Algemene Informatie" 
                icon={<BookText className="h-4 w-4" />}
              >
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Vaknaam</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedProgram.name}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Vakcode</label>
                      <p className="text-sm text-gray-900">{selectedProgram.code}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Duur (jaren)</label>
                      <p className="text-sm text-gray-900">{selectedProgram.duration}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Afdeling</label>
                      <p className="text-sm text-gray-900">{selectedProgram.department}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      <Badge variant={selectedProgram.isActive ? "default" : "secondary"}>
                        {selectedProgram.isActive ? "Actief" : "Inactief"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Beschrijving</label>
                    <p className="text-sm text-gray-900 mt-1 p-3 bg-white border rounded-md min-h-[80px]">
                      {selectedProgram.description || 'Geen beschrijving'}
                    </p>
                  </div>
                </div>
              </SectionContainer>

              {/* Toegewezen Docenten */}
              <SectionContainer 
                title="Toegewezen Docenten" 
                icon={<Users className="h-4 w-4" />}
              >
                <div className="space-y-3">
                  {selectedProgram.assignedTeachers && selectedProgram.assignedTeachers.length > 0 ? (
                    selectedProgram.assignedTeachers
                      .filter((teacher: any) => teacher.selected)
                      .map((teacher: any) => (
                        <div key={teacher.id} className="flex items-center gap-3 p-3 bg-white border rounded-md">
                          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                            {teacher.name ? teacher.name.substring(0, 2).toUpperCase() : 'DC'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{teacher.name || 'Docent'}</p>
                            <p className="text-xs text-gray-500">Toegewezen docent</p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">Geen docenten toegewezen</p>
                  )}
                </div>
              </SectionContainer>
            </div>

            {/* Curriculum Sectie */}
            <SectionContainer 
              title="Curriculum & Leerdoelen" 
              icon={<Target className="h-4 w-4" />}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-700">Instroomvereisten</label>
                  <div className="mt-2 p-3 bg-white border rounded-md min-h-[100px]">
                    <p className="text-sm text-gray-900">
                      {selectedProgram.entryRequirements || 'Geen instroomvereisten opgegeven'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Leerdoelen</label>
                  <div className="mt-2 p-3 bg-white border rounded-md min-h-[100px]">
                    <p className="text-sm text-gray-900">
                      {selectedProgram.learningObjectives || 'Geen leerdoelen opgegeven'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Competenties</label>
                  <div className="mt-2 p-3 bg-white border rounded-md min-h-[100px]">
                    <p className="text-sm text-gray-900">
                      {selectedProgram.competencies || 'Geen competenties opgegeven'}
                    </p>
                  </div>
                </div>
              </div>
            </SectionContainer>
          </DialogFormContainer>
        )}
        
        <DialogFooterContainer
          onCancel={() => setIsViewDialogOpen(false)}
          cancelText="Sluiten"
          showSubmitButton={false}
        />
      </CustomDialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, program: null })}
        onConfirm={() => {
          if (deleteConfirmation.program) {
            deleteProgramMutation.mutate(deleteConfirmation.program.id);
          }
        }}
        title="Vak verwijderen"
        description={`Weet je zeker dat je het vak "${deleteConfirmation.program?.name}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`}
        isLoading={deleteProgramMutation.isPending}
      />
      </div>
    </div>
  );
}
