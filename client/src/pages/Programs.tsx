import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, ChevronDown, ChevronUp, Edit, Trash2, Clock, Users, Calendar, BookOpen, Building, BookText, XCircle, GraduationCap, X } from 'lucide-react';
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
}

interface ProgramFormData {
  name: string;
  code: string;
  department: string;
  description: string;
  duration: number;
  isActive: boolean;
}

export default function Programs() {
  const { toast } = useToast();
  
  // State voor filters en paginering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // State voor dialoogvensters
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  
  // Formulier state
  const [programFormData, setProgramFormData] = useState<ProgramFormData>({
    name: '',
    code: '',
    department: '',
    description: '',
    duration: 1,
    isActive: true
  });
  
  // Haal alle vakken op
  const { data: programsData, isLoading, isError } = useQuery({
    queryKey: ['/api/programs', searchTerm, filterActive, sortColumn, sortDirection],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterActive !== null) params.append('active', filterActive.toString());
      params.append('sort', sortColumn);
      params.append('direction', sortDirection);
      
      return await apiRequest(`/api/programs?${params.toString()}`);
    }
  });
  
  // Mutatie voor het aanmaken van een vak
  const createProgramMutation = useMutation({
    mutationFn: (programData: ProgramFormData) => 
      apiRequest('/api/programs', 'POST', programData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Vak toegevoegd",
        description: "Het vak is succesvol toegevoegd aan het systeem.",
        variant: "default",
      });
      // Reset formulier
      setProgramFormData({
        name: '',
        code: '',
        department: '',
        description: '',
        duration: 1,
        isActive: true
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van het vak.",
        variant: "destructive",
      });
      console.error('Create error:', error);
    }
  });
  
  // Mutatie voor het bijwerken van een vak
  const updateProgramMutation = useMutation({
    mutationFn: (programData: { id: number; data: ProgramFormData }) => 
      apiRequest(`/api/programs/${programData.id}`, 'PUT', programData.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Vak bijgewerkt",
        description: "Het vak is succesvol bijgewerkt in het systeem.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken",
        description: "Er is een fout opgetreden bij het bijwerken van het vak.",
        variant: "destructive",
      });
      console.error('Update error:', error);
    }
  });
  
  // Mutatie voor het verwijderen van een vak
  const deleteProgramMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/programs/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Vak verwijderd",
        description: "Het vak is succesvol verwijderd uit het systeem.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van het vak.",
        variant: "destructive",
      });
      console.error('Delete error:', error);
    }
  });
  
  // Handler voor het aanmaken van een nieuw vak
  const handleAddProgram = () => {
    setProgramFormData({
      name: '',
      code: '',
      department: '',
      description: '',
      duration: 1,
      isActive: true
    });
    setIsAddDialogOpen(true);
  };
  
  // Handler voor het bewerken van een vak
  const handleEditProgram = (program: Program) => {
    setSelectedProgram(program);
    setProgramFormData({
      name: program.name,
      code: program.code,
      department: program.department || '',
      description: program.description || '',
      duration: program.duration,
      isActive: program.isActive
    });
    setIsEditDialogOpen(true);
  };
  
  // Handler voor het verwijderen van een vak
  const handleDeleteProgram = (program: Program) => {
    setSelectedProgram(program);
    setIsDeleteDialogOpen(true);
  };
  
  // Handler voor het bevestigen van verwijderen
  const confirmDeleteProgram = () => {
    if (selectedProgram) {
      deleteProgramMutation.mutate(selectedProgram.id);
    }
  };
  
  // Handler voor het instellen van sorteerkolom
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Handler voor het toevoegen van een vak
  const handleSubmitProgram = (e: React.FormEvent) => {
    e.preventDefault();
    createProgramMutation.mutate(programFormData);
  };
  
  // Handler voor het bijwerken van een vak
  const handleSubmitEditProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProgram) {
      updateProgramMutation.mutate({
        id: selectedProgram.id,
        data: programFormData
      });
    }
  };
  
  const programs = programsData || [];
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vakken</h1>
          <p className="text-gray-500 mt-1">Beheer alle beschikbare vakken en opleidingen</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button onClick={handleAddProgram} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            Vak Toevoegen
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Zoek op naam of code..."
              className="pl-8 pr-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <XCircle
                className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 cursor-pointer"
                onClick={() => setSearchTerm('')}
              />
            )}
          </div>
          
          <Select
            value={filterActive === null ? 'all' : filterActive ? 'active' : 'inactive'}
            onValueChange={(value) => {
              if (value === 'all') setFilterActive(null);
              else if (value === 'active') setFilterActive(true);
              else setFilterActive(false);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <span>Status filter</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="active">Actief</SelectItem>
              <SelectItem value="inactive">Inactief</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center">
                    <span>Naam</span>
                    {sortColumn === 'name' && (
                      sortDirection === 'asc' 
                        ? <ChevronUp className="ml-1 h-4 w-4" /> 
                        : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('code')}>
                  <div className="flex items-center">
                    <span>Code</span>
                    {sortColumn === 'code' && (
                      sortDirection === 'asc' 
                        ? <ChevronUp className="ml-1 h-4 w-4" /> 
                        : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('department')}>
                  <div className="flex items-center">
                    <span>Afdeling</span>
                    {sortColumn === 'department' && (
                      sortDirection === 'asc' 
                        ? <ChevronUp className="ml-1 h-4 w-4" /> 
                        : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('duration')}>
                  <div className="flex items-center">
                    <span>Duur</span>
                    {sortColumn === 'duration' && (
                      sortDirection === 'asc' 
                        ? <ChevronUp className="ml-1 h-4 w-4" /> 
                        : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('isActive')}>
                  <div className="flex items-center">
                    <span>Status</span>
                    {sortColumn === 'isActive' && (
                      sortDirection === 'asc' 
                        ? <ChevronUp className="ml-1 h-4 w-4" /> 
                        : <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
                    </div>
                    <div className="mt-2">Laden...</div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center text-red-500">
                    Er is een fout opgetreden bij het laden van de vakken.
                  </td>
                </tr>
              ) : programs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center text-gray-500">
                    <BookText className="mx-auto h-12 w-12 text-gray-300" />
                    <div className="mt-2 font-medium">Geen vakken gevonden</div>
                    <div className="mt-1 text-sm">
                      {searchTerm ? `Geen resultaten voor "${searchTerm}"` : "Er zijn nog geen vakken toegevoegd."}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={handleAddProgram}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Vak Toevoegen
                    </Button>
                  </td>
                </tr>
              ) : (
                programs.map((program: Program) => (
                  <tr key={program.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">
                      {program.name}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {program.code}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {program.department || "-"}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {program.duration === 1 ? 'Jaar' : 
                      program.duration === 2 ? 'Semester' : 
                      program.duration === 3 ? 'Trimester' : 
                      `${program.duration}`}
                    </td>
                    <td className="py-4 px-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        program.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {program.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-right space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditProgram(program)}
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                        <span className="sr-only">Bewerken</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeleteProgram(program)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                        <span className="sr-only">Verwijderen</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vak Toevoegen Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[85%] max-h-[90vh] h-auto overflow-y-auto p-0">
          {/* Blauwe header */}
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
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
                className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Sluiten</span>
              </Button>
            </div>
          </div>
          
          <div className="px-6 py-4">
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
              
              <div className="mt-6 border-t border-gray-200 pt-4 flex justify-end gap-2">
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
                    Vak bewerken
                  </DialogTitle>
                  <DialogDescription className="text-sm text-blue-100 font-medium">
                    Vul de onderstaande velden in om dit vak bij te werken.
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditDialogOpen(false)}
                className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Sluiten</span>
              </Button>
            </div>
          </div>
          
          <div className="px-6 py-4">
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
              
              <div className="mt-6 border-t border-gray-200 pt-4 flex justify-end gap-2">
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
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vak verwijderen dialoogvenster */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[85%] max-h-[90vh] h-auto overflow-y-auto p-0">
          {/* Blauwe header */}
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    Vak verwijderen
                  </DialogTitle>
                  <DialogDescription className="text-sm text-blue-100 font-medium">
                    Weet je zeker dat je dit vak wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Sluiten</span>
              </Button>
            </div>
          </div>
          
          <div className="px-6 py-4">
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
            
            <div className="mt-6 border-t border-gray-200 pt-4 flex justify-end gap-2">
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}