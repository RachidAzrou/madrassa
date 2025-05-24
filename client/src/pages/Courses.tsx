import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Eye, Pencil, Trash2, BookOpen, Users, XCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

// Type definities
type CourseType = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  programId: number | null;
  credits: number;
  instructor: string | null;
  maxStudents: number | null;
  isActive: boolean;
  learningObjectives: string | null;
  materials: string | null;
  competencies: string | null;
  prerequisites: string | null;
  enrolledStudents?: number;
  createdAt?: string;
};

type ProgramType = {
  id: number;
  name: string;
  code: string;
};

type StudentGroupType = {
  id: number;
  name: string;
  academicYear: string;
  programId: number | null;
  isActive: boolean;
  enrolledStudents?: number;
  createdAt?: string;
};

export default function Courses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [isViewingCourse, setIsViewingCourse] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<CourseType | null>(null);
  
  // Fetch data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/courses', searchTerm, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());
      
      const response = await fetch(`/api/courses?${params.toString()}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    }
  });
  
  const { data: programsData } = useQuery({
    queryKey: ['/api/programs'],
    queryFn: async () => {
      const response = await fetch('/api/programs');
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    }
  });
  
  const { data: studentGroupsData } = useQuery({
    queryKey: ['/api/student-groups'],
    queryFn: async () => {
      const response = await fetch('/api/student-groups');
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    }
  });
  
  // Mutation for deleting course
  const deleteCourse = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: "Vak verwijderd",
        description: "Het vak is succesvol verwijderd.",
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
  
  // Data preparation
  const courses = data?.courses || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const programs = programsData || [];
  const studentGroups = studentGroupsData || [];
  
  // Event handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  // Handle add course
  const handleAddCourse = () => {
    setCurrentCourse(null);
    setIsAddingCourse(true);
    setIsEditingCourse(false);
    setIsViewingCourse(false);
    setIsDialogOpen(true);
  };
  
  // Handle edit course
  const handleEditCourse = (course: CourseType) => {
    setCurrentCourse(course);
    setIsEditingCourse(true);
    setIsAddingCourse(false);
    setIsViewingCourse(false);
    setIsDialogOpen(true);
  };
  
  // Handle view course
  const handleViewCourse = (course: CourseType) => {
    setCurrentCourse(course);
    setIsViewingCourse(true);
    setIsAddingCourse(false);
    setIsEditingCourse(false);
    setIsDialogOpen(true);
  };
  
  // Handle delete course
  const handleDeleteCourse = (course: CourseType) => {
    if (window.confirm(`Weet je zeker dat je "${course.name}" wilt verwijderen?`)) {
      deleteCourse.mutate(course.id);
    }
  };
  
  // Dialog submit handler
  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle form submission logic here
    // ...
    
    setIsDialogOpen(false);
  };
  
  // Function to get program name
  const getProgramName = (id: number | null) => {
    if (!id) return 'Geen programma';
    const program = programs.find((p: ProgramType) => p.id === id);
    return program ? program.name : 'Onbekend programma';
  };
  
  // Render the page
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col md:flex-row md:items-center border-b border-gray-200 pb-4 w-full">
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <div className="p-3 rounded-md bg-[#1e3a8a] text-white">
              <BookOpen className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Vakken</h1>
              <p className="text-base text-gray-500 mt-1">Beheer vakken, curricula en lesmaterialen</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Zoekbalk en acties */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Zoek vakken..."
              className="pl-8 bg-white w-full"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <XCircle
                className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600"
                onClick={() => setSearchTerm("")}
              />
            )}
          </div>
          
          <Button 
            onClick={handleAddCourse} 
            className="flex items-center bg-primary hover:bg-primary/90"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Vak Toevoegen</span>
          </Button>
        </div>
      </div>
      
      {/* Spacing element */}
      <div className="mb-5 mt-6"></div>
      
      <div className="w-full">
        {/* Table with Courses and Student Groups */}
        <div className="bg-white rounded-md border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="py-3 px-2 w-10 font-medium text-xs uppercase text-gray-500 text-center">
                  <Checkbox 
                    className="translate-y-[2px]"
                    onCheckedChange={(checked) => {
                      // Hier later functionaliteit toevoegen voor 'selecteer alles'
                    }}
                  />
                  <span className="sr-only">Selecteer Alles</span>
                </th>
                <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">Soort</th>
                <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">Naam</th>
                <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">Status</th>
                <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-right">
                  <span className="sr-only">Acties</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-red-500">
                    Fout bij het laden van curriculum. Probeer het opnieuw.
                  </td>
                </tr>
              ) : courses.length === 0 && studentGroups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <div className="h-32 flex flex-col items-center justify-center text-gray-500">
                      <div className="text-[#1e3a8a] mb-2">
                        <BookOpen className="h-12 w-12 mx-auto opacity-30" />
                      </div>
                      <p className="text-sm font-medium">Geen curriculum beschikbaar</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {/* Courses rows */}
                  {courses.map((course: CourseType) => (
                    <tr key={`course-${course.id}`} className="group hover:bg-blue-50/50 transition-colors border-b border-gray-200">
                      <td className="py-3 px-2 text-center">
                        <Checkbox 
                          className="translate-y-[2px]"
                          onCheckedChange={(checked) => {
                            // Hier later functionaliteit toevoegen voor individuele selectie
                          }}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-50">
                          Vak
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{course.name}</div>
                        <div className="text-gray-500 text-xs">{course.code} • {course.credits || 0} studiepunten</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={course.isActive ? "default" : "outline"} className={course.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : "text-gray-500"}>
                          {course.isActive ? "Actief" : "Inactief"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-blue-600"
                            onClick={() => handleViewCourse(course)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Details bekijken</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-slate-600"
                            onClick={() => handleEditCourse(course)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Bewerken</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() => handleDeleteCourse(course)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Verwijderen</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Student Groups rows */}
                  {studentGroups.map((group: StudentGroupType) => (
                    <tr key={`group-${group.id}`} className="group hover:bg-blue-50/50 transition-colors border-b border-gray-200">
                      <td className="py-3 px-2 text-center">
                        <Checkbox 
                          className="translate-y-[2px]"
                          onCheckedChange={(checked) => {
                            // Hier later functionaliteit toevoegen voor individuele selectie
                          }}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800 hover:bg-green-50">
                          Klas
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{group.name}</div>
                        <div className="text-gray-500 text-xs">{group.academicYear} • {group.enrolledStudents || 0} studenten</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={group.isActive ? "default" : "outline"} className={group.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : "text-gray-500"}>
                          {group.isActive ? "Actief" : "Inactief"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-blue-600"
                            onClick={() => {/* Handle view group */}}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Details bekijken</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-slate-600"
                            onClick={() => {/* Handle edit group */}}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Bewerken</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() => {/* Handle delete group */}}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Verwijderen</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
          
          {/* Pagination UI */}
          {!isLoading && !isError && totalPages > 1 && (
            <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Pagina <span className="font-medium">{currentPage}</span> van <span className="font-medium">{totalPages}</span>
                {totalCount > 0 && <span> ({totalCount} items)</span>}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Vorige
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Volgende
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Add/Edit/View Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditingCourse ? "Vak Bewerken" : isAddingCourse ? "Nieuw Vak Toevoegen" : "Vak Details"}
            </DialogTitle>
            <DialogDescription>
              {isEditingCourse 
                ? "Bewerk de onderstaande gegevens om dit vak bij te werken." 
                : isAddingCourse 
                  ? "Vul de onderstaande gegevens in om een nieuw vak toe te voegen." 
                  : "Details van het geselecteerde vak."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleDialogSubmit}>
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
                      name="name"
                      required
                      defaultValue={currentCourse?.name || ""}
                      className="mt-1"
                      disabled={isViewingCourse}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-right">
                      Vakcode <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="code"
                      name="code"
                      required
                      defaultValue={currentCourse?.code || ""}
                      className="mt-1"
                      disabled={isViewingCourse}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="credits" className="text-right">
                      Studiepunten
                    </Label>
                    <Input
                      id="credits"
                      name="credits"
                      type="number"
                      defaultValue={currentCourse?.credits?.toString() || ""}
                      className="mt-1"
                      disabled={isViewingCourse}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <Select
                      defaultValue={currentCourse?.isActive ? "true" : "false"}
                      disabled={isViewingCourse}
                      name="isActive"
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
                    name="description"
                    className="w-full min-h-[100px] p-2 mt-1 border rounded-md"
                    defaultValue={currentCourse?.description || ""}
                    disabled={isViewingCourse}
                    placeholder="Geef een korte beschrijving van de lesstof en leerdoelen van dit vak"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4 border-b pb-2">Curriculum</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prerequisites">Instroomvereisten</Label>
                    <textarea
                      id="prerequisites"
                      name="prerequisites"
                      className="w-full min-h-[80px] p-2 mt-1 border rounded-md"
                      defaultValue={currentCourse?.prerequisites || ""}
                      disabled={isViewingCourse}
                      placeholder="Vereiste voorkennis of vaardigheden voor dit vak"
                    />
                    <p className="text-xs text-gray-500">
                      Wat moeten studenten weten of kunnen voordat ze aan dit vak beginnen?
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="learningObjectives">Leerdoelen / Leerplan</Label>
                    <textarea
                      id="learningObjectives"
                      name="learningObjectives"
                      className="w-full min-h-[80px] p-2 mt-1 border rounded-md"
                      defaultValue={currentCourse?.learningObjectives || ""}
                      disabled={isViewingCourse}
                      placeholder="Wat studenten zullen leren bij dit vak"
                    />
                    <p className="text-xs text-gray-500">
                      Welke kennis en vaardigheden worden verwacht dat studenten verwerven?
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="competencies">Uitstroomvereisten / Competenties</Label>
                    <textarea
                      id="competencies"
                      name="competencies"
                      className="w-full min-h-[80px] p-2 mt-1 border rounded-md"
                      defaultValue={currentCourse?.competencies || ""}
                      disabled={isViewingCourse}
                      placeholder="Competenties die studenten ontwikkelen"
                    />
                    <p className="text-xs text-gray-500">
                      Welke competenties moeten studenten hebben verworven na afronding?
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="materials">Leermateriaal</Label>
                    <textarea
                      id="materials"
                      name="materials"
                      className="w-full min-h-[80px] p-2 mt-1 border rounded-md"
                      defaultValue={currentCourse?.materials || ""}
                      disabled={isViewingCourse}
                      placeholder="Boeken, artikelen en andere leermaterialen"
                    />
                    <p className="text-xs text-gray-500">
                      Welke materialen worden gebruikt voor dit vak?
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                {isViewingCourse ? "Sluiten" : "Annuleren"}
              </Button>
              
              {!isViewingCourse && (
                <Button type="submit">
                  {isEditingCourse ? "Wijzigingen Opslaan" : "Vak Toevoegen"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}