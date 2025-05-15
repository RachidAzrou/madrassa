import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Edit, Trash2, Check, Folder } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StudentProgramsProps {
  studentId: number;
}

interface Program {
  id: number;
  name: string;
  code: string;
  description: string | null;
  duration: number;
}

interface StudentProgram {
  id: number;
  studentId: number;
  programId: number;
  programName?: string;
  yearLevel: number | null;
  enrollmentDate: string | null;
  isPrimary: boolean;
  status: string;
}

interface ProgramFormData {
  programId: number | null;
  yearLevel: number | null;
  isPrimary: boolean;
  status: string;
}

export default function StudentPrograms({ studentId }: StudentProgramsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State voor formulieren en dialogen
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<StudentProgram | null>(null);
  const [programFormData, setProgramFormData] = useState<ProgramFormData>({
    programId: null,
    yearLevel: null,
    isPrimary: false,
    status: "active",
  });
  
  // Ophalen van programma's voor de dropdown
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });
  
  // Ophalen van programma's van de student
  const { data: studentPrograms = [], isLoading } = useQuery<StudentProgram[]>({
    queryKey: ["/api/students", studentId, "programs"],
    queryFn: async () => {
      const data = await apiRequest("GET", `/api/students/${studentId}/programs`);
      
      // Verrijk de studentprogramma data met programmanamen
      return data.map((sp: StudentProgram) => {
        const program = programs.find(p => p.id === sp.programId);
        return {
          ...sp,
          programName: program?.name || "Onbekend programma"
        };
      });
    },
    enabled: !!studentId && programs.length > 0,
  });
  
  // Reset form data wanneer het dialoogvenster wordt geopend
  useEffect(() => {
    if (isAddDialogOpen) {
      setProgramFormData({
        programId: null,
        yearLevel: null,
        isPrimary: studentPrograms.length === 0, // Als er nog geen programma's zijn, is dit het primaire programma
        status: "active",
      });
    }
  }, [isAddDialogOpen, studentPrograms]);
  
  // Mutatie om een programma toe te voegen voor de student
  const addProgramMutation = useMutation({
    mutationFn: async (formData: ProgramFormData) => {
      return apiRequest("POST", "/api/student-programs", {
        studentId,
        programId: formData.programId,
        yearLevel: formData.yearLevel,
        isPrimary: formData.isPrimary,
        status: formData.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId, "programs"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Vak toegevoegd",
        description: "Het vak is succesvol toegevoegd aan de student.",
      });
    },
    onError: (error: any) => {
      console.error("Fout bij toevoegen vak:", error);
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van het vak.",
        variant: "destructive",
      });
    },
  });
  
  // Mutatie om een programma bij te werken
  const updateProgramMutation = useMutation({
    mutationFn: async (data: { id: number; formData: ProgramFormData }) => {
      return apiRequest("PATCH", `/api/student-programs/${data.id}`, {
        yearLevel: data.formData.yearLevel,
        isPrimary: data.formData.isPrimary,
        status: data.formData.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId, "programs"] });
      setIsEditDialogOpen(false);
      setSelectedProgram(null);
      toast({
        title: "Programma bijgewerkt",
        description: "Het programma is succesvol bijgewerkt.",
      });
    },
    onError: (error: any) => {
      console.error("Fout bij bijwerken programma:", error);
      toast({
        title: "Fout bij bijwerken",
        description: "Er is een fout opgetreden bij het bijwerken van het programma.",
        variant: "destructive",
      });
    },
  });
  
  // Mutatie om een programma te verwijderen
  const deleteProgramMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/student-programs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students", studentId, "programs"] });
      setIsDeleteDialogOpen(false);
      setSelectedProgram(null);
      toast({
        title: "Programma verwijderd",
        description: "Het programma is succesvol verwijderd van de student.",
      });
    },
    onError: (error: any) => {
      console.error("Fout bij verwijderen programma:", error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van het programma.",
        variant: "destructive",
      });
    },
  });
  
  // Verwerking van formulieren
  const handleAddProgram = () => {
    setIsAddDialogOpen(true);
  };
  
  const handleEditProgram = (program: StudentProgram) => {
    setSelectedProgram(program);
    setProgramFormData({
      programId: program.programId,
      yearLevel: program.yearLevel,
      isPrimary: program.isPrimary,
      status: program.status,
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteProgram = (program: StudentProgram) => {
    setSelectedProgram(program);
    setIsDeleteDialogOpen(true);
  };
  
  const handleProgramIdChange = (value: string) => {
    setProgramFormData({
      ...programFormData,
      programId: value && value !== "none" ? parseInt(value) : null,
      yearLevel: null, // Reset the year level when program changes
    });
  };
  
  const handleYearLevelChange = (value: string) => {
    setProgramFormData({
      ...programFormData,
      yearLevel: value && value !== "none" ? parseInt(value) : null,
    });
  };
  
  const handleStatusChange = (value: string) => {
    setProgramFormData({
      ...programFormData,
      status: value,
    });
  };
  
  const handlePrimaryChange = (checked: boolean) => {
    setProgramFormData({
      ...programFormData,
      isPrimary: checked,
    });
  };
  
  const handleSubmitAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (programFormData.programId) {
      addProgramMutation.mutate(programFormData);
    } else {
      toast({
        title: "Onvolledige gegevens",
        description: "Selecteer een programma om door te gaan.",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmitEditProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProgram) {
      updateProgramMutation.mutate({
        id: selectedProgram.id,
        formData: programFormData,
      });
    }
  };
  
  const handleConfirmDelete = () => {
    if (selectedProgram) {
      deleteProgramMutation.mutate(selectedProgram.id);
    }
  };
  
  // Functie om studiejaren te genereren op basis van programma duur
  const getYearLevelOptions = (programId: number | null): number[] => {
    if (!programId) return [];
    
    // Zoek het geselecteerde programma op
    const selectedProgram = programs.find((p) => p.id === programId);
    
    // Als het programma gevonden is, maak dan een array met jaren van 1 tot en met de duur
    if (selectedProgram) {
      return Array.from({length: selectedProgram.duration}, (_, i) => i + 1);
    }
    
    return [];
  };
  
  // Helper functie om status badge kleur te bepalen
  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | "success" | "warning" | null | undefined => {
    switch (status.toLowerCase()) {
      case 'active':
        return "success";
      case 'pending':
        return "warning";
      case 'inactive':
        return "secondary";
      case 'completed':
        return "outline";
      default:
        return "default";
    }
  };
  
  // Functie om status naam te lokaliseren
  const getLocalizedStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return "Actief";
      case 'pending':
        return "In afwachting";
      case 'inactive':
        return "Inactief";
      case 'completed':
        return "Voltooid";
      default:
        return status;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h3 className="text-xl font-semibold">Programma-inschrijvingen</h3>
        <Button variant="outline" size="sm" onClick={handleAddProgram}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Programma Toevoegen
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]"></div>
          <p className="mt-2">Programma's laden...</p>
        </div>
      ) : studentPrograms.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <Folder className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-lg font-medium">Geen programma's gevonden</p>
          <p className="text-muted-foreground">Deze student is nog niet ingeschreven voor een programma.</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={handleAddProgram}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Programma Toevoegen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {studentPrograms.map((program) => (
            <Card key={program.id} className={`overflow-hidden transition-all hover:shadow-md ${program.isPrimary ? "border-primary" : ""}`}>
              <CardHeader className="pb-2 bg-muted/20">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-md flex items-center">
                      {program.programName}
                      {program.isPrimary && (
                        <Badge className="ml-2 bg-primary/80" title="Primair programma">
                          <Check className="h-3 w-3 mr-1" /> Primair
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {program.yearLevel ? `Jaar ${program.yearLevel}` : "Geen jaar toegewezen"}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(program.status)}>
                    {getLocalizedStatus(program.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="pt-3 flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleEditProgram(program)}>
                  <Edit className="h-4 w-4 mr-1" /> Bewerken
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDeleteProgram(program)}
                  disabled={program.isPrimary && studentPrograms.length > 1}
                  title={program.isPrimary && studentPrograms.length > 1 ? "U kunt het primaire programma niet verwijderen" : ""}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Verwijderen
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Toevoegen Dialoogvenster */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-[95vw] w-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vak Toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een nieuw vak toe aan deze student.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAddProgram}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="programId" className="text-right">
                    Vak <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={programFormData.programId?.toString() || ''}
                    onValueChange={handleProgramIdChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer programma" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id.toString()}>
                          {program.name} ({program.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="yearLevel" className="text-right">
                    Studiejaar
                  </Label>
                  <Select
                    value={programFormData.yearLevel?.toString() || ''}
                    onValueChange={handleYearLevelChange}
                    disabled={!programFormData.programId}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={!programFormData.programId ? "Selecteer eerst een programma" : "Selecteer jaar"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Geen jaar</SelectItem>
                      {getYearLevelOptions(programFormData.programId).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          Jaar {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select
                    value={programFormData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actief</SelectItem>
                      <SelectItem value="pending">In afwachting</SelectItem>
                      <SelectItem value="inactive">Inactief</SelectItem>
                      <SelectItem value="completed">Voltooid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox 
                    id="isPrimary" 
                    checked={programFormData.isPrimary}
                    onCheckedChange={handlePrimaryChange}
                    disabled={studentPrograms.length === 0} // Disabled als dit het eerste programma is (altijd primair)
                  />
                  <Label htmlFor="isPrimary" className="font-normal">
                    Dit is het primaire programma
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                disabled={addProgramMutation.isPending}
              >
                {addProgramMutation.isPending ? "Bezig met toevoegen..." : "Programma Toevoegen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Bewerken Dialoogvenster */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-none w-auto">
          <DialogHeader>
            <DialogTitle>Programma Bewerken</DialogTitle>
            <DialogDescription>
              Werk de programma-inschrijving bij.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEditProgram}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-right font-semibold">
                    Vak
                  </Label>
                  <p className="mt-1 text-muted-foreground">
                    {programs.find(p => p.id === programFormData.programId)?.name || "Onbekend vak"}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="yearLevel" className="text-right">
                    Studiejaar
                  </Label>
                  <Select
                    value={programFormData.yearLevel?.toString() || ''}
                    onValueChange={handleYearLevelChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer jaar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Geen jaar</SelectItem>
                      {getYearLevelOptions(programFormData.programId).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          Jaar {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select
                    value={programFormData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actief</SelectItem>
                      <SelectItem value="pending">In afwachting</SelectItem>
                      <SelectItem value="inactive">Inactief</SelectItem>
                      <SelectItem value="completed">Voltooid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox 
                    id="isPrimary" 
                    checked={programFormData.isPrimary}
                    onCheckedChange={handlePrimaryChange}
                    disabled={programFormData.isPrimary && studentPrograms.length > 1} // Kan niet worden uitgeschakeld als dit het enige primaire programma is
                  />
                  <Label htmlFor="isPrimary" className="font-normal">
                    Dit is het primaire programma
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                disabled={updateProgramMutation.isPending}
              >
                {updateProgramMutation.isPending ? "Bezig met bijwerken..." : "Programma Bijwerken"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Verwijderen Dialoogvenster */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Programma Verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze programma-inschrijving wilt verwijderen?
              Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedProgram && (
              <div className="text-center">
                <p className="font-semibold">{programs.find(p => p.id === selectedProgram.programId)?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedProgram.yearLevel ? `Jaar ${selectedProgram.yearLevel}` : "Geen jaar toegewezen"}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteProgramMutation.isPending}
            >
              {deleteProgramMutation.isPending ? "Bezig met verwijderen..." : "Verwijderen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}