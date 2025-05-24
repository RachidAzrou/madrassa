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
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center">
            <div className="mr-3 text-[#1e3a8a] bg-blue-100 rounded-lg p-2">
              <BookText className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1e3a8a]">Vakken</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-11">
            Beheer en organiseer alle vakken in het curriculum
          </p>
        </div>
      </div>
      {/* Zoek en Voeg toe knoppen - onder de streep */}
      <div className="space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Zoek vakken..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-8 bg-white"
          />
          {searchTerm && (
            <XCircle
              className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600"
              onClick={() => setSearchTerm("")}
            />
          )}
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleAddProgram} 
            variant="default"
            size="default"
            className="bg-primary hover:bg-primary/90 flex items-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Vak Toevoegen</span>
          </Button>
        </div>
      </div>
      {/* Programs list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-red-500">
            Fout bij het laden van vakken. Probeer het opnieuw.
          </div>
        ) : programs.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-gray-500">
            <div className="text-[#1e3a8a] mb-2">
              <BookText className="h-12 w-12 mx-auto opacity-30" />
            </div>
            <p className="text-sm font-medium">Geen vakken beschikbaar</p>
          </div>
        ) : (
          programs.map((program: Program) => (
            <div key={program.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(program.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-800">{program.name}</h3>
                    <span className="ml-3 bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded">{program.code}</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">{program.description}</p>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center hidden md:block">
                    <span className="text-gray-500 text-xs block">Duur</span>
                    <span className="text-gray-800 font-medium">
                      {program.duration === 1 ? 'Jaar' : 
                       program.duration === 2 ? 'Semester' : 
                       program.duration === 3 ? 'Trimester' : 
                       `${program.duration}`}
                    </span>
                  </div>
                  <div className="text-center hidden md:block">
                    <span className="text-gray-500 text-xs block">Klas</span>
                    <span className="text-gray-800 font-medium">{'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-500 hover:text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation(); // Voorkom dat de program toggle wordt geactiveerd
                        handleEditProgram(program.id);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Bewerken</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation(); // Voorkom dat de program toggle wordt geactiveerd
                        handleDeleteProgram(program.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Verwijderen</span>
                    </Button>
                    {expandedProgram === program.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              {expandedProgram === program.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center">
                      <Clock className="h-5 w-5 text-primary mr-3" />
                      <div>
                        <span className="text-xs text-gray-500 block">Duur</span>
                        <span className="text-sm font-medium">
                          {program.duration === 1 ? 'Jaar' : 
                           program.duration === 2 ? 'Semester' : 
                           program.duration === 3 ? 'Trimester' : 
                           `${program.duration}`}
                        </span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center">
                      <Users className="h-5 w-5 text-primary mr-3" />
                      <div>
                        <span className="text-xs text-gray-500 block">Studenten</span>
                        <span className="text-sm font-medium">{program.students || 0}</span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center">
                      <Building className="h-5 w-5 text-primary mr-3" />
                      <div>
                        <span className="text-xs text-gray-500 block">Afdeling</span>
                        <span className="text-sm font-medium capitalize">{program.department || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Beschrijving</h4>
                    <p className="text-sm text-gray-600">{program.description}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {/* Vak Toevoegen Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[85%] max-h-[90vh] h-auto overflow-y-auto p-0">
          {/* Blauwe header */}
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    Vak Toevoegen
                  </DialogTitle>
                  <DialogDescription className="text-sm text-blue-100 font-medium">
                    Vul de onderstaande velden in om een nieuw vak toe te voegen.
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAddDialogOpen(false)}
                className="h-8 w-8 rounded-full bg-white/20 p-0 text-white hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="px-6 py-4">
            <form onSubmit={handleSubmitProgram} className="space-y-4">
              <Tabs defaultValue="algemeen" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4 p-1 bg-[#1e3a8a]/10 rounded-md">
                  <TabsTrigger value="algemeen" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                    <Info className="h-4 w-4" />
                    <span>Algemeen</span>
                  </TabsTrigger>
                  <TabsTrigger value="curriculum" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                    <BookOpen className="h-4 w-4" />
                    <span>Curriculum</span>
                  </TabsTrigger>
                  <TabsTrigger value="planning" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                    <ChalkBoard />
                    <span>Klas</span>
                  </TabsTrigger>
                </TabsList>

                {/* Algemeen tabblad */}
                <TabsContent value="algemeen" className="mt-0">
                  <div className="p-4 bg-white rounded-lg min-h-[450px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-medium text-gray-700">
                          Naam van het vak <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          required
                          value={programFormData.name}
                          onChange={(e) => setProgramFormData({ ...programFormData, name: e.target.value })}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="Voer vaknaam in"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="code" className="text-xs font-medium text-gray-700">
                          Vakcode <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="code"
                          required
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
                </TabsContent>

                {/* Curriculum tabblad */}
                <TabsContent value="curriculum" className="mt-0">
                  <div className="p-4 bg-white rounded-lg min-h-[450px]">
                    <div className="space-y-4">
                      
                      <div className="space-y-2">
                        <Label htmlFor="instroomvereisten" className="text-xs font-medium text-gray-700">Instroomvereisten</Label>
                        <Textarea
                          id="instroomvereisten"
                          placeholder="Beschrijf de vereiste kennis of vaardigheden voor dit vak"
                          className="resize-none text-sm bg-white border-gray-200 min-h-[80px]"
                        />
                        <p className="text-xs text-gray-500">
                          Wat moeten studenten weten of kunnen voordat ze dit vak kunnen volgen?
                        </p>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="uitstroomvereisten" className="text-xs font-medium text-gray-700">Uitstroomvereisten</Label>
                        <Textarea
                          id="uitstroomvereisten"
                          placeholder="Beschrijf wat studenten moeten beheersen na afronding van dit vak"
                          className="resize-none text-sm bg-white border-gray-200 min-h-[80px]"
                        />
                        <p className="text-xs text-gray-500">
                          Welke competenties moeten studenten hebben verworven na afronding?
                        </p>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="leerplan" className="text-xs font-medium text-gray-700">Leerdoelen / Leerplan</Label>
                        <Textarea
                          id="leerplan"
                          placeholder="Beschrijf de leerdoelen en het leerplan voor dit vak"
                          className="resize-none text-sm bg-white border-gray-200 min-h-[80px]"
                        />
                        <p className="text-xs text-gray-500">
                          Wat zijn de belangrijkste leerdoelen en onderdelen van het leerplan?
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Planning tabblad */}
                <TabsContent value="planning" className="mt-0">
                  <div className="p-4 bg-white rounded-lg min-h-[450px]">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-md bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm text-gray-500">Selecteer één of meerdere klassen</p>
                        </div>
                        <div className="text-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-sm font-medium text-gray-700 mb-1">Klassen kunnen worden toegewezen</p>
                          <p className="text-xs text-gray-500">Klassen kunnen worden toegewezen nadat het vak is aangemaakt.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="p-4 border-t flex justify-end gap-3 bg-gray-50 -mx-6 -mb-6">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-gray-300">
                  Annuleren
                </Button>
                <Button type="submit">Vak toevoegen</Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      {/* Vak bewerken dialoogvenster */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[85%] max-h-[90vh] h-auto overflow-y-auto p-0">
          {/* Blauwe header */}
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Pencil className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    Vak Bewerken
                  </DialogTitle>
                  <DialogDescription className="text-sm text-blue-100 font-medium">
                    Bewerk de details van dit vak.
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditDialogOpen(false)}
                className="h-8 w-8 rounded-full bg-white/20 p-0 text-white hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="px-6 py-4">
            <form onSubmit={handleSubmitEditProgram} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-xs font-medium text-gray-700">
                    Naam van het vak <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    required
                    value={programFormData.name}
                    onChange={(e) => setProgramFormData({ ...programFormData, name: e.target.value })}
                    className="mt-1 h-9 text-sm bg-white border-gray-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-code" className="text-xs font-medium text-gray-700">
                    Vakcode <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-code"
                    required
                    value={programFormData.code}
                    onChange={(e) => setProgramFormData({ ...programFormData, code: e.target.value })}
                    className="mt-1 h-9 text-sm bg-white border-gray-200"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Button type="submit">
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
