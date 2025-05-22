import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, ChevronDown, ChevronUp, Edit, Trash2, Clock, Users, Calendar, BookOpen, Building, BookText, XCircle, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
            <p className="text-sm font-medium">Geen opleidingen beschikbaar</p>
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
                      <BookOpen className="h-5 w-5 text-primary mr-3" />
                      <div>
                        <span className="text-xs text-gray-500 block">Klas</span>
                        <span className="text-sm font-medium">{'N/A'}</span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center">
                      <Calendar className="h-5 w-5 text-primary mr-3" />
                      <div>
                        <span className="text-xs text-gray-500 block">Status</span>
                        <span className="text-sm font-medium">{program.isActive ? 'Actief' : 'Inactief'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vak Toevoegen</DialogTitle>
            <DialogDescription>
              Vul de onderstaande velden in om een nieuw vak toe te voegen.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitProgram}>
            <div className="space-y-6 py-4">
              <div>
                <h3 className="text-lg font-medium mb-4 border-b pb-2">Algemene Informatie</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-right">
                      Naam van het vak <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      required
                      value={programFormData.name}
                      onChange={(e) => setProgramFormData({ ...programFormData, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-right">
                      Vakcode <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="code"
                      required
                      value={programFormData.code}
                      onChange={(e) => setProgramFormData({ ...programFormData, code: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-right">
                      Duur
                    </Label>
                    <Select
                      value={programFormData.duration.toString()}
                      onValueChange={(value) => setProgramFormData({ ...programFormData, duration: parseInt(value) })}
                    >
                      <SelectTrigger id="duration" className="mt-1">
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
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <Select
                      value={programFormData.isActive ? "true" : "false"}
                      onValueChange={(value) => setProgramFormData({ ...programFormData, isActive: value === "true" })}
                    >
                      <SelectTrigger id="status" className="mt-1">
                        <SelectValue placeholder="Selecteer status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Actief</SelectItem>
                        <SelectItem value="false">Inactief</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="description" className="text-right">
                    Beschrijving van het vak
                  </Label>
                  <textarea
                    id="description"
                    className="w-full min-h-[100px] p-2 mt-1 border rounded-md"
                    value={programFormData.description}
                    onChange={(e) => setProgramFormData({ ...programFormData, description: e.target.value })}
                    placeholder="Geef een korte beschrijving van de lesstof en leerdoelen van dit vak"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4 border-b pb-2">Toewijzing</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="classes">Klassen waarin dit vak wordt gegeven</Label>
                    <div className="p-4 border rounded-md bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-500">Selecteer één of meerdere klassen</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {/* Hier zouden normaal checkboxen komen voor beschikbare klassen */}
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="class1" className="h-4 w-4 text-primary" />
                          <Label htmlFor="class1" className="text-sm">Klas 1A</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="class2" className="h-4 w-4 text-primary" />
                          <Label htmlFor="class2" className="text-sm">Klas 2B</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="class3" className="h-4 w-4 text-primary" />
                          <Label htmlFor="class3" className="text-sm">Klas 3C</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="teachers">Docenten die dit vak geven</Label>
                    <div className="p-4 border rounded-md bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-500">Selecteer één of meerdere docenten</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {/* Hier zouden normaal checkboxen komen voor beschikbare docenten */}
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="teacher1" className="h-4 w-4 text-primary" />
                          <Label htmlFor="teacher1" className="text-sm">Mohammed Youssef</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="teacher2" className="h-4 w-4 text-primary" />
                          <Label htmlFor="teacher2" className="text-sm">Fatima El Amrani</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="teacher3" className="h-4 w-4 text-primary" />
                          <Label htmlFor="teacher3" className="text-sm">Ibrahim Bouali</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Annuleren
              </Button>
              <Button 
                type="submit" 
                disabled={createProgramMutation.isPending}
              >
                {createProgramMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Bezig met toevoegen...
                  </>
                ) : (
                  "Toevoegen"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Vak bewerken dialoogvenster */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vak bewerken</DialogTitle>
            <DialogDescription>
              Vul de onderstaande velden in om dit vak bij te werken.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEditProgram}>
            <div className="space-y-6 py-4">
              <div>
                <h3 className="text-lg font-medium mb-4 border-b pb-2">Algemene Informatie</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-right">
                      Naam van het vak <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-name"
                      required
                      value={programFormData.name}
                      onChange={(e) => setProgramFormData({ ...programFormData, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-code" className="text-right">
                      Vakcode <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-code"
                      required
                      value={programFormData.code}
                      onChange={(e) => setProgramFormData({ ...programFormData, code: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-duration" className="text-right">
                      Duur
                    </Label>
                    <Select
                      value={programFormData.duration.toString()}
                      onValueChange={(value) => setProgramFormData({ ...programFormData, duration: parseInt(value) })}
                    >
                      <SelectTrigger id="edit-duration" className="mt-1">
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
                    <Label htmlFor="edit-status" className="text-right">
                      Status
                    </Label>
                    <Select
                      value={programFormData.isActive ? "true" : "false"}
                      onValueChange={(value) => setProgramFormData({ ...programFormData, isActive: value === "true" })}
                    >
                      <SelectTrigger id="edit-status" className="mt-1">
                        <SelectValue placeholder="Selecteer status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Actief</SelectItem>
                        <SelectItem value="false">Inactief</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label htmlFor="edit-description" className="text-right">
                    Beschrijving van het vak
                  </Label>
                  <textarea
                    id="edit-description"
                    className="w-full min-h-[100px] p-2 mt-1 border rounded-md"
                    value={programFormData.description}
                    onChange={(e) => setProgramFormData({ ...programFormData, description: e.target.value })}
                    placeholder="Geef een korte beschrijving van de lesstof en leerdoelen van dit vak"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4 border-b pb-2">Toewijzing</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-classes">Klassen waarin dit vak wordt gegeven</Label>
                    <div className="p-4 border rounded-md bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-500">Selecteer één of meerdere klassen</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {/* Hier zouden normaal checkboxen komen voor beschikbare klassen */}
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="edit-class1" className="h-4 w-4 text-primary" />
                          <Label htmlFor="edit-class1" className="text-sm">Klas 1A</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="edit-class2" className="h-4 w-4 text-primary" />
                          <Label htmlFor="edit-class2" className="text-sm">Klas 2B</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="edit-class3" className="h-4 w-4 text-primary" />
                          <Label htmlFor="edit-class3" className="text-sm">Klas 3C</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-teachers">Docenten die dit vak geven</Label>
                    <div className="p-4 border rounded-md bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-500">Selecteer één of meerdere docenten</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {/* Hier zouden normaal checkboxen komen voor beschikbare docenten */}
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="edit-teacher1" className="h-4 w-4 text-primary" />
                          <Label htmlFor="edit-teacher1" className="text-sm">Mohammed Youssef</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="edit-teacher2" className="h-4 w-4 text-primary" />
                          <Label htmlFor="edit-teacher2" className="text-sm">Fatima El Amrani</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="edit-teacher3" className="h-4 w-4 text-primary" />
                          <Label htmlFor="edit-teacher3" className="text-sm">Ibrahim Bouali</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                disabled={updateProgramMutation.isPending}
              >
                {updateProgramMutation.isPending ? 'Bezig met bijwerken...' : 'Opslaan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Vak verwijderen dialoogvenster */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Vak verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je dit vak wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProgram && (
            <div className="py-4 space-y-3">
              <div className="border rounded-md p-3 bg-red-50">
                <p className="text-sm text-gray-700 font-medium">
                  Je staat op het punt om het volgende vak te verwijderen:
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm"><span className="font-medium">Naam:</span> {selectedProgram.name}</p>
                  <p className="text-sm"><span className="font-medium">Code:</span> {selectedProgram.code}</p>
                  {selectedProgram.department && (
                    <p className="text-sm"><span className="font-medium">Afdeling:</span> {selectedProgram.department}</p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">Duur:</span> {
                      selectedProgram.duration === 1 ? 'Jaar' : 
                      selectedProgram.duration === 2 ? 'Semester' : 
                      selectedProgram.duration === 3 ? 'Trimester' : 
                      `${selectedProgram.duration}`
                    }
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Status:</span> {selectedProgram.isActive ? 'Actief' : 'Inactief'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-red-600">
                Let op: Bij het verwijderen van een vak worden alle hieraan gekoppelde cursussen, studenten en materialen losgekoppeld. Controleer of er geen actieve cursussen meer zijn gekoppeld aan dit vak.
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteProgram}
              disabled={deleteProgramMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteProgramMutation.isPending && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              )}
              {deleteProgramMutation.isPending ? 'Bezig met verwijderen...' : 'Verwijderen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}