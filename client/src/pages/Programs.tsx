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
import { DataTableContainer, SearchActionBar, TableContainer, DataTableHeader, QuickActions, EmptyTableState, TableLoadingState } from '@/components/ui/data-table-container';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
        <div className="bg-white border border-[#e5e7eb] rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e5e7eb]">
              <thead className="bg-[#f9fafc]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Vak</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Code</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Afdeling</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Duur</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Status</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right w-[120px]">
                    <span className="text-xs font-medium text-gray-700"></span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e5e7eb]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="w-6 h-6 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-sm text-gray-500">Vakken laden...</span>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center py-6">
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
                          className="h-8 w-8 text-red-500 mb-2"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <p className="text-sm text-red-500">Er is een fout opgetreden bij het laden van de vakken.</p>
                      </div>
                    </td>
                  </tr>
                ) : programs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="h-48 flex flex-col items-center justify-center text-gray-500">
                        <div className="text-[#1e3a8a] mb-2">
                          <BookText className="h-12 w-12" />
                        </div>
                        <p className="text-sm font-medium">Geen vakken gevonden</p>
                        <p className="text-sm text-gray-400 mb-4">
                          {searchTerm 
                            ? "Geen vakken komen overeen met uw zoekcriteria."
                            : "Er zijn nog geen vakken aangemaakt."}
                        </p>
                        <Button
                          onClick={handleAddProgram}
                          className="bg-[#1e40af] hover:bg-[#1e3a8a]"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Eerste Vak Aanmaken
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  programs.map((program: Program) => (
                    <tr 
                      key={program.id} 
                      className="hover:bg-gray-50 group transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{program.name}</div>
                            <div className="text-xs text-gray-500">{program.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded">
                          {program.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{program.department || '-'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {program.duration === 1 ? '1 Jaar' : 
                           program.duration === 2 ? '1 Semester' : 
                           program.duration === 3 ? '1 Trimester' : 
                           `${program.duration} Maanden`}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          program.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {program.isActive ? 'Actief' : 'Inactief'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <QuickActions
                          onEdit={() => handleEditProgram(program.id)}
                          onDelete={() => handleDeleteProgram(program.id)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Nieuw vak dialoogvenster */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nieuw vak toevoegen</DialogTitle>
            <DialogDescription>
              Vul de onderstaande gegevens in om een nieuw vak toe te voegen.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitProgram}>
            <Tabs defaultValue="algemeen" className="mt-2">
              <TabsList className="mb-4">
                <TabsTrigger value="algemeen">Algemene informatie</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="docenten">Docenten</TabsTrigger>
              </TabsList>
              
              <TabsContent value="algemeen" className="mt-0">
                <div className="p-4 bg-white rounded-lg min-h-[450px]">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-medium text-gray-700">
                          Naam vak <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          value={programFormData.name}
                          onChange={(e) => setProgramFormData({ ...programFormData, name: e.target.value })}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="Voer vaknaam in"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="code" className="text-xs font-medium text-gray-700">
                          Code <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="code"
                          value={programFormData.code}
                          onChange={(e) => setProgramFormData({ ...programFormData, code: e.target.value })}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="Voer vakcode in"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="duration" className="text-xs font-medium text-gray-700">
                          Duur
                        </Label>
                        <Select
                          value={programFormData.duration.toString()}
                          onValueChange={(value) => setProgramFormData({ ...programFormData, duration: parseInt(value) })}
                        >
                          <SelectTrigger id="duration" className="mt-1 h-9 text-sm bg-white border-gray-200">
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
                        <Label htmlFor="status" className="text-xs font-medium text-gray-700">
                          Status
                        </Label>
                        <Select
                          value={programFormData.isActive ? "true" : "false"}
                          onValueChange={(value) => setProgramFormData({ ...programFormData, isActive: value === "true" })}
                        >
                          <SelectTrigger id="status" className="mt-1 h-9 text-sm bg-white border-gray-200">
                            <SelectValue placeholder="Selecteer status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Actief</SelectItem>
                            <SelectItem value="false">Inactief</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      

                      <div className="col-span-1 md:col-span-2">
                        <Label htmlFor="description" className="text-xs font-medium text-gray-700">
                          Beschrijving
                        </Label>
                        <Textarea
                          id="description"
                          value={programFormData.description || ""}
                          onChange={(e) => setProgramFormData({ ...programFormData, description: e.target.value })}
                          className="mt-1 min-h-[100px] resize-none text-sm bg-white border-gray-200"
                          placeholder="Geef een beschrijving van het vak..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Curriculum tabblad */}
              <TabsContent value="curriculum" className="mt-0">
                <div className="p-4 bg-white rounded-lg min-h-[450px]">
                  <div className="space-y-4">
                    
                    <div className="space-y-2">
                      <Label htmlFor="instroomvereisten" className="text-xs font-medium text-gray-700">Instroomvereisten</Label>
                      <Textarea
                        id="instroomvereisten"
                        className="mt-1 min-h-[100px] resize-none text-sm bg-white border-gray-200"
                        placeholder="Beschrijf de instroomvereisten..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="leerdoelen" className="text-xs font-medium text-gray-700">Leerdoelen</Label>
                      <Textarea
                        id="leerdoelen"
                        className="mt-1 min-h-[100px] resize-none text-sm bg-white border-gray-200"
                        placeholder="Beschrijf de leerdoelen van dit vak..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="competenties" className="text-xs font-medium text-gray-700">Competenties</Label>
                      <Textarea
                        id="competenties"
                        className="mt-1 min-h-[100px] resize-none text-sm bg-white border-gray-200"
                        placeholder="Lijst van competenties die studenten ontwikkelen..."
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Docenten tabblad */}
              <TabsContent value="docenten" className="mt-0">
                <div className="p-4 bg-white rounded-lg min-h-[450px]">
                  <div className="space-y-4">
                    <Label className="text-xs font-medium text-gray-700">Toegewezen docenten</Label>
                    <div className="border border-gray-200 rounded-md p-2 max-h-[300px] overflow-auto">
                      {teachersData?.teachers && teachersData.teachers.length > 0 ? (
                        <div className="space-y-2">
                          {teachersData.teachers.map((teacher: any) => (
                            <div key={teacher.id} className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-50 rounded">
                              <Checkbox 
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
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="hover:bg-[#1e40af]/90 bg-[#1e40af]">
                Vak toevoegen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Vak bewerken dialoogvenster */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Vak bewerken</DialogTitle>
            <DialogDescription>
              Bewerk de gegevens van het geselecteerde vak.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <form onSubmit={handleSubmitEditProgram} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-xs font-medium text-gray-700">
                    Naam vak <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={programFormData.name}
                    onChange={(e) => setProgramFormData({ ...programFormData, name: e.target.value })}
                    className="mt-1 h-9 text-sm bg-white border-gray-200"
                    placeholder="Voer vaknaam in"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-code" className="text-xs font-medium text-gray-700">
                    Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-code"
                    value={programFormData.code}
                    onChange={(e) => setProgramFormData({ ...programFormData, code: e.target.value })}
                    className="mt-1 h-9 text-sm bg-white border-gray-200"
                    placeholder="Voer vakcode in"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-duration" className="text-xs font-medium text-gray-700">
                    Duur
                  </Label>
                  <Select
                    value={programFormData.duration.toString()}
                    onValueChange={(value) => setProgramFormData({ ...programFormData, duration: parseInt(value) })}
                  >
                    <SelectTrigger id="edit-duration" className="mt-1 h-9 text-sm bg-white border-gray-200">
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
                  <Label htmlFor="edit-status" className="text-xs font-medium text-gray-700">
                    Status
                  </Label>
                  <Select
                    value={programFormData.isActive ? "true" : "false"}
                    onValueChange={(value) => setProgramFormData({ ...programFormData, isActive: value === "true" })}
                  >
                    <SelectTrigger id="edit-status" className="mt-1 h-9 text-sm bg-white border-gray-200">
                      <SelectValue placeholder="Selecteer status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Actief</SelectItem>
                      <SelectItem value="false">Inactief</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description" className="text-xs font-medium text-gray-700">
                  Beschrijving
                </Label>
                <Textarea
                  id="edit-description"
                  value={programFormData.description}
                  onChange={(e) => setProgramFormData({ ...programFormData, description: e.target.value })}
                  className="mt-1 min-h-[100px] resize-none text-sm bg-white border-gray-200"
                  placeholder="Geef een beschrijving van het vak..."
                />
              </div>
              
              <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 -mx-6 -mb-6">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-gray-300">
                  Annuleren
                </Button>
                <Button type="submit" className="hover:bg-[#1e40af]/90 bg-[#1e40af]">
                  Opslaan
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      {/* Vak verwijderen dialoogvenster */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Vak verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je dit vak wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
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
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProgram}>
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
