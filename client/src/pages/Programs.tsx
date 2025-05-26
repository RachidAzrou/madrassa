import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, ChevronDown, ChevronUp, Edit, Trash2, Clock, Users, Calendar, BookOpen, Building, BookText, XCircle, GraduationCap, X, Pencil, Info } from 'lucide-react';

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
import { PremiumHeader } from '@/components/layout/premium-header';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [programFormData, setProgramFormData] = useState({
    name: '',
    code: '',
    description: '',
    duration: 4,
    department: '',
    isActive: true,
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

  // Als data direct een array is, gebruik het; anders zoek naar data.programs
  const programs = Array.isArray(data) ? data : data?.programs || [];

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
  
  const handleEditProgram = (id: number) => {
    const program = programs.find(p => p.id === id);
    if (program) {
      setSelectedProgram(program);
      setProgramFormData({
        name: program.name || '',
        code: program.code || '',
        description: program.description || '',
        duration: program.duration || 4,
        department: program.department || '',
        isActive: program.isActive,
        assignedClasses: [],
        assignedTeachers: [],
      });
      setIsEditDialogOpen(true);
    }
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

  const handleDeleteProgram = (id: number) => {
    const program = programs.find(p => p.id === id);
    if (program) {
      setSelectedProgram(program);
      setIsDeleteDialogOpen(true);
    }
  };

  // Verbeterde mutatie voor het verwijderen van een programma
  const deleteProgramMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        return await apiRequest(`/api/programs/${id}`, {
          method: 'DELETE'
        });
      } catch (error: any) {
        console.error('Error deleting program:', error);
        throw new Error(error?.message || 'Fout bij het verwijderen van het programma');
      }
    },
    onSuccess: () => {
      // Invalideer relevante queries
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      // Reset UI-state
      setIsDeleteDialogOpen(false);
      setSelectedProgram(null);
      
      // Toon succes melding
      toast({
        title: "Programma verwijderd",
        description: "Het programma is succesvol verwijderd uit het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting program:', error);
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van het programma. Mogelijk zijn er nog actieve cursussen of studenten gekoppeld aan dit programma.",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
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
      const updatedTeachers = prev.assignedTeachers.map(t => 
        t.id === teacherId ? { ...t, selected } : t
      );
      return { ...prev, assignedTeachers: updatedTeachers };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Premium header component */}
      <PremiumHeader 
        title="Vakken" 
        path="Evaluatie > Vakken" 
        icon={BookText}
        description="Beheer alle vakken binnen het curriculum, inclusief toewijzing aan docenten en klassen"
      />
      
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
              onClick={handleAddProgram}
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
              <StandardTableHeaderCell>Vak</StandardTableHeaderCell>
              <StandardTableHeaderCell>Code</StandardTableHeaderCell>
              <StandardTableHeaderCell>Afdeling</StandardTableHeaderCell>
              <StandardTableHeaderCell>Duur</StandardTableHeaderCell>
              <StandardTableHeaderCell>Status</StandardTableHeaderCell>
              <EmptyActionHeader />
            </tr>
          </StandardTableHeader>
          <StandardTableBody>
            {isLoading ? (
              <TableLoadingState colSpan={6} message="Vakken laden..." />
            ) : isError ? (
              <TableErrorState 
                colSpan={6} 
                message="Er is een fout opgetreden bij het laden van de vakken."
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['/api/programs'] })}
              />
            ) : programs.length === 0 ? (
              <TableEmptyState
                colSpan={6}
                icon={<BookText className="h-12 w-12 mx-auto text-gray-300" />}
                title="Geen vakken gevonden"
                description={searchTerm 
                  ? "Geen vakken komen overeen met uw zoekcriteria."
                  : "Er zijn nog geen vakken aangemaakt."}
                action={
                  <Button
                    onClick={handleAddProgram}
                    className="bg-[#1e40af] hover:bg-[#1e3a8a]"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Eerste Vak Aanmaken
                  </Button>
                }
              />
            ) : (
              programs.map((program: Program) => (
                <StandardTableRow key={program.id}>
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
                    <span className="text-gray-900">{program.department || '-'}</span>
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
                    <QuickActions
                      onEdit={() => handleEditProgram(program.id)}
                      onDelete={() => handleDeleteProgram(program.id)}
                    />
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
              </TabsList>
              
              <TabsContent value="algemeen" className="mt-0">
                <div className="space-y-4">
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel htmlFor="instroomvereisten">Instroomvereisten</FormLabel>
                    <Textarea
                      id="instroomvereisten"
                      className="min-h-[100px] resize-none text-sm"
                      placeholder="Beschrijf de instroomvereisten..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <FormLabel htmlFor="leerdoelen">Leerdoelen</FormLabel>
                    <Textarea
                      id="leerdoelen"
                      className="min-h-[100px] resize-none text-sm"
                      placeholder="Beschrijf de leerdoelen van dit vak..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <FormLabel htmlFor="competenties">Competenties</FormLabel>
                    <Textarea
                      id="competenties"
                      className="min-h-[100px] resize-none text-sm"
                      placeholder="Lijst van competenties die studenten ontwikkelen..."
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="docenten" className="mt-0">
                <div className="space-y-4">
                  <FormLabel>Toegewezen docenten</FormLabel>
                  <div className="border border-gray-200 rounded-md p-4 max-h-[300px] overflow-auto">
                    {teachersData?.teachers && teachersData.teachers.length > 0 ? (
                      <div className="space-y-2">
                        {teachersData.teachers.map((teacher: any) => (
                          <div key={teacher.id} className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-50 rounded">
                            <StyledCheckbox 
                              id={`teacher-${teacher.id}`}
                              checked={programFormData.assignedTeachers.find(t => t.id === teacher.id)?.selected || false}
                              onCheckedChange={(checked) => handleTeacherSelection(teacher.id, checked === true)}
                            />
                            <Label 
                              htmlFor={`teacher-${teacher.id}`}
                              className="text-sm font-normal text-gray-700 cursor-pointer flex-grow"
                            >
                              {teacher.firstName} {teacher.lastName}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 italic">
                        Geen docenten beschikbaar
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </form>
        
        <DialogFooterContainer
          onCancel={() => setIsAddDialogOpen(false)}
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
        
        <form onSubmit={handleSubmitEditProgram}>
          <div className="p-6 pt-4">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel htmlFor="edit-name">
                    Naam vak <span className="text-red-500">*</span>
                  </FormLabel>
                  <Input
                    id="edit-name"
                    value={programFormData.name}
                    onChange={(e) => setProgramFormData({ ...programFormData, name: e.target.value })}
                    className="h-9 text-sm"
                    placeholder="Voer vaknaam in"
                  />
                </div>
                
                <div className="space-y-2">
                  <FormLabel htmlFor="edit-code">
                    Code <span className="text-red-500">*</span>
                  </FormLabel>
                  <Input
                    id="edit-code"
                    value={programFormData.code}
                    onChange={(e) => setProgramFormData({ ...programFormData, code: e.target.value })}
                    className="h-9 text-sm"
                    placeholder="Voer vakcode in"
                  />
                </div>
                
                <div className="space-y-2">
                  <FormLabel htmlFor="edit-duration">Duur</FormLabel>
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
                  <FormLabel htmlFor="edit-status">Status</FormLabel>
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
                <FormLabel htmlFor="edit-description">Beschrijving</FormLabel>
                <Textarea
                  id="edit-description"
                  value={programFormData.description}
                  onChange={(e) => setProgramFormData({ ...programFormData, description: e.target.value })}
                  className="min-h-[100px] resize-none text-sm"
                  placeholder="Geef een beschrijving van het vak..."
                />
              </div>
            </div>
          </div>
        </form>
        
        <DialogFooterContainer
          onCancel={() => setIsEditDialogOpen(false)}
          cancelText="Annuleren"
          submitText="Opslaan"
        />
      </CustomDialog>
      {/* Vak verwijderen dialoogvenster */}
      <CustomDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} maxWidth="450px">
        <DialogHeaderWithIcon
          title="Vak Verwijderen"
          description="Weet je zeker dat je dit vak wilt verwijderen?"
          icon={<Trash2 className="h-5 w-5" />}
        />
        
        <div className="p-6 pt-4">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md mt-2">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {selectedProgram && (
                    <>
                      Je staat op het punt om het vak <span className="font-medium">{selectedProgram.name}</span> ({selectedProgram.code}) te verwijderen.
                      <br />
                      <span className="text-red-600 font-medium">Deze actie kan niet ongedaan worden gemaakt.</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooterContainer>
          <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="w-full sm:w-auto">
            Annuleren
          </Button>
          <Button variant="destructive" onClick={confirmDeleteProgram} className="w-full sm:w-auto">
            Verwijderen
          </Button>
        </DialogFooterContainer>
      </CustomDialog>
    </div>
  );
}
