import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Plus, Eye, Edit, Trash2, Users, MapPin, BookOpen, 
  GraduationCap, Target, X, Save, UserCheck, Filter, PlusCircle,
  School
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { 
  DataTableContainer, 
  SearchActionBar, 
  ActionButtonsContainer,
  FilterLabel,
  FilterSelect,
  FilterSelectItem,
  QuickActions
} from '@/components/ui/data-table-container';
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
  TableCheckboxHeader,
  TableCheckboxCell,
  EmptyActionHeader
} from '@/components/ui/standard-table';
import { apiRequest } from '@/lib/queryClient';
import { PremiumHeader } from '@/components/layout/premium-header';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { 
  CustomDialog, 
  DialogHeaderWithIcon, 
  DialogFormContainer, 
  SectionContainer, 
  DialogFooterContainer 
} from '@/components/ui/custom-dialog';




type ClassType = {
  id: number;
  name: string;
  location?: string;
  maxCapacity?: number;
  subjects?: string[];
  teacherId?: number;
  teacherName?: string;
  prerequisites?: string;
  learningGoals?: string;
  academicYear?: string;
  isActive?: boolean;
  studentCount?: number;
};

export default function StudentGroups() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management - exact same structure as Students page
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterAcademicYear, setFilterAcademicYear] = useState("all");
  const [filterStudentGroup, setFilterStudentGroup] = useState("all");
  const [filterClassName, setFilterClassName] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNewClassDialog, setShowNewClassDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Form data for new/edit class
  const [newClass, setNewClass] = useState({
    name: '',
    location: '',
    maxCapacity: '',
    subjects: [] as number[], // Changed to store subject IDs
    teacherId: '',
    prerequisites: '',
    learningGoals: '',
    academicYear: new Date().getFullYear().toString(),
  });

  const [editFormData, setEditFormData] = useState<Partial<ClassType>>({});

  // Data queries
  const { data: classes = [], isLoading, isError } = useQuery({
    queryKey: ['/api/student-groups'],
    queryFn: async () => {
      const response = await apiRequest('/api/student-groups');
      return response || [];
    },
  });

  const { data: teachersData = [] } = useQuery({
    queryKey: ['/api/teachers'],
    queryFn: async () => {
      const response = await apiRequest('/api/teachers');
      return response || [];
    },
  });

  const teachers = Array.isArray(teachersData) ? teachersData : (teachersData?.teachers || []);

  // Query voor vakken
  const { data: coursesData = [] } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: async () => {
      const response = await apiRequest('/api/courses');
      return response || [];
    },
  });

  const courses = Array.isArray(coursesData) ? coursesData : (coursesData?.courses || []);

  // Query voor programs/vakken
  const { data: programsData = [] } = useQuery({
    queryKey: ['/api/programs'],
    queryFn: async () => {
      const response = await apiRequest('/api/programs');
      return response || [];
    },
  });

  const programs = Array.isArray(programsData) ? programsData : (programsData?.programs || []);
  
  // Debug log om te zien wat we hebben
  console.log('Programs data:', programs);

  // Filter function - exact same structure as Students page
  const filteredClasses = classes.filter((cls: ClassType) => {
    const matchesSearch = !searchTerm || 
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAcademicYear = filterAcademicYear === 'all' || cls.academicYear === filterAcademicYear;
    const matchesClassName = filterClassName === 'all' || cls.name === filterClassName;
    const matchesLocation = filterLocation === 'all' || cls.location === filterLocation;

    return matchesSearch && matchesAcademicYear && matchesClassName && matchesLocation;
  });

  // Mutations
  const createClassMutation = useMutation({
    mutationFn: async (classData: any) => {
      return apiRequest('/api/student-groups', { method: 'POST', body: classData });
    },
    onSuccess: () => {
      toast({ title: "Klas aangemaakt", description: "De nieuwe klas is succesvol aangemaakt." });
      setShowNewClassDialog(false);
      resetNewClassForm();
      queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Fout bij aanmaken", 
        description: error?.message || "Er is een fout opgetreden.", 
        variant: "destructive" 
      });
    }
  });

  const updateClassMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/student-groups/${id}`, { method: 'PUT', body: data });
    },
    onSuccess: () => {
      toast({ title: "Klas bijgewerkt", description: "De klas is succesvol bijgewerkt." });
      setShowEditDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Fout bij bijwerken", 
        description: error?.message || "Er is een fout opgetreden.", 
        variant: "destructive" 
      });
    }
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/student-groups/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({ title: "Klas verwijderd", description: "De klas is succesvol verwijderd." });
      setShowDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Fout bij verwijderen", 
        description: error?.message || "Er is een fout opgetreden.", 
        variant: "destructive" 
      });
    }
  });

  // Event handlers
  const resetNewClassForm = () => {
    setNewClass({
      name: '',
      location: '',
      maxCapacity: '',
      subjects: [],
      teacherId: '',
      prerequisites: '',
      learningGoals: '',
      academicYear: new Date().getFullYear().toString(),
    });
  };

  const handleSaveClass = () => {
    if (!newClass.name.trim()) {
      toast({ title: "Validatiefout", description: "Klasnaam is verplicht.", variant: "destructive" });
      return;
    }

    const classData = {
      name: newClass.name,
      location: newClass.location,
      maxCapacity: newClass.maxCapacity ? parseInt(newClass.maxCapacity) : undefined,
      subjects: newClass.subjects,
      teacherId: newClass.teacherId ? parseInt(newClass.teacherId) : undefined,
      prerequisites: newClass.prerequisites,
      learningGoals: newClass.learningGoals,
      academicYear: newClass.academicYear,
      isActive: true,
    };

    createClassMutation.mutate(classData);
  };

  const handleViewClass = (cls: ClassType) => {
    setSelectedClass(cls);
    setShowViewDialog(true);
  };

  const handleEditClass = (cls: ClassType) => {
    setSelectedClass(cls);
    setEditFormData({
      name: cls.name,
      location: cls.location || '',
      maxCapacity: cls.maxCapacity,
      subjects: cls.subjects || [],
      teacherId: cls.teacherId,
      prerequisites: cls.prerequisites || '',
      learningGoals: cls.learningGoals || '',
      academicYear: cls.academicYear || new Date().getFullYear().toString(),
    });
    setShowEditDialog(true);
  };

  const handleDeleteClass = (cls: ClassType) => {
    setSelectedClass(cls);
    setShowDeleteDialog(true);
  };

  const handleEditSubmit = () => {
    if (selectedClass && editFormData.name?.trim()) {
      updateClassMutation.mutate({
        id: selectedClass.id,
        data: editFormData
      });
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSelectChange = (name: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const addSubjectToNewClass = (subjectId: number) => {
    if (!newClass.subjects.includes(subjectId)) {
      setNewClass(prev => ({ ...prev, subjects: [...prev.subjects, subjectId] }));
    }
  };

  const removeSubjectFromNewClass = (subjectId: number) => {
    setNewClass(prev => ({
      ...prev,
      subjects: prev.subjects.filter(id => id !== subjectId)
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterAcademicYear('all');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PremiumHeader 
        title="Klassen" 
        path="Beheer > Klassen" 
        icon={School}
        description="Beheer klasgroepen, bekijk studentenlijsten en wijs docenten toe aan klassen"
      />

      <DataTableContainer>
        {/* Search and action bar */}
        <SearchActionBar>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Zoek klassen op naam, docent of locatie..."
              className="pl-9 h-8 text-xs bg-white rounded-sm border-[#e5e7eb]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 items-center ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterOptions(!showFilterOptions)}
              className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
              title="Filters"
            >
              <Filter className="h-3.5 w-3.5" />
            </Button>
            
            <Button
              onClick={() => setShowNewClassDialog(true)}
              size="sm"
              className="h-7 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              Nieuwe Klas
            </Button>
          </div>
        </SearchActionBar>

        {/* Filter opties - exact copy from Students page */}
        {showFilterOptions && (
          <div className="px-4 py-3 border-t border-[#e5e7eb] flex flex-wrap gap-3 items-center">
            <div className="flex items-center">
              {(filterAcademicYear !== 'all' || filterClassName !== 'all' || filterLocation !== 'all') && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setFilterAcademicYear('all');
                    setFilterClassName('all');
                    setFilterLocation('all');
                  }}
                  className="h-7 text-xs text-blue-600 p-0 mr-3"
                >
                  Filters wissen
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Select 
                value={filterClassName} 
                onValueChange={setFilterClassName}
              >
                <SelectTrigger className="w-40 h-7 text-xs rounded-sm border-[#e5e7eb] bg-white">
                  <SelectValue placeholder="Klas" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#e5e7eb]">
                  <SelectItem value="all" className="focus:bg-blue-200 hover:bg-blue-100">Alle klassen</SelectItem>
                  {[...new Set(classes.map((cls: ClassType) => cls.name))].map((className) => (
                    <SelectItem key={className} value={className} className="focus:bg-blue-200 hover:bg-blue-100">
                      {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={filterAcademicYear} 
                onValueChange={setFilterAcademicYear}
              >
                <SelectTrigger className="w-40 h-7 text-xs rounded-sm border-[#e5e7eb] bg-white">
                  <SelectValue placeholder="Schooljaar" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#e5e7eb]">
                  <SelectItem value="all" className="focus:bg-blue-200 hover:bg-blue-100">Alle schooljaren</SelectItem>
                  <SelectItem value="2025-2026" className="focus:bg-blue-200 hover:bg-blue-100">2025-2026</SelectItem>
                  <SelectItem value="2024-2025" className="focus:bg-blue-200 hover:bg-blue-100">2024-2025</SelectItem>
                  <SelectItem value="2023-2024" className="focus:bg-blue-200 hover:bg-blue-100">2023-2024</SelectItem>
                  <SelectItem value="2022-2023" className="focus:bg-blue-200 hover:bg-blue-100">2022-2023</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={filterLocation} 
                onValueChange={setFilterLocation}
              >
                <SelectTrigger className="w-40 h-7 text-xs rounded-sm border-[#e5e7eb] bg-white">
                  <SelectValue placeholder="Locatie" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#e5e7eb]">
                  <SelectItem value="all" className="focus:bg-blue-200 hover:bg-blue-100">Alle locaties</SelectItem>
                  {[...new Set(classes.map((cls: ClassType) => cls.location).filter(Boolean))].map((location) => (
                    <SelectItem key={location} value={location} className="focus:bg-blue-200 hover:bg-blue-100">
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Classes table */}
        <StandardTable>
          <StandardTableHeader>
            <tr>
              <TableCheckboxHeader
                checked={selectedClasses.length > 0 && selectedClasses.length === filteredClasses.length}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedClasses(filteredClasses.map((cls: ClassType) => cls.id));
                  } else {
                    setSelectedClasses([]);
                  }
                }}
              />
              <StandardTableHeaderCell>Klas</StandardTableHeaderCell>
              <StandardTableHeaderCell>Schooljaar</StandardTableHeaderCell>
              <StandardTableHeaderCell>Locatie</StandardTableHeaderCell>
              <StandardTableHeaderCell>Capaciteit</StandardTableHeaderCell>
              <StandardTableHeaderCell>Klastitularis</StandardTableHeaderCell>
              <EmptyActionHeader />
            </tr>
          </StandardTableHeader>
          <StandardTableBody>
            {isLoading ? (
              <TableLoadingState colSpan={7} message="Klassen laden..." />
            ) : isError ? (
              <TableErrorState 
                colSpan={7} 
                message="Er is een fout opgetreden bij het laden van de klassen."
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] })}
              />
            ) : filteredClasses.length === 0 ? (
              <TableEmptyState
                colSpan={7}
                icon={<School className="h-12 w-12 mx-auto text-gray-300" />}
                title="Geen klassen gevonden"
                description={searchTerm || filterAcademicYear !== 'all' 
                  ? "Geen klassen komen overeen met uw zoekcriteria."
                  : "Er zijn nog geen klassen aangemaakt."}
              />
            ) : (
              filteredClasses.map((cls: ClassType) => (
                <StandardTableRow key={cls.id}>
                  <TableCheckboxCell
                    checked={selectedClasses.includes(cls.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedClasses([...selectedClasses, cls.id]);
                      } else {
                        setSelectedClasses(selectedClasses.filter(id => id !== cls.id));
                      }
                    }}
                  />
                  <StandardTableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium text-gray-900">{cls.name}</div>
                      </div>
                    </div>
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap">
                    <span className="text-gray-900">{cls.academicYear || '-'}</span>
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap">
                    <span className="text-gray-900">{cls.location || '-'}</span>
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap">
                    <span className="text-gray-900">
                      {cls.studentCount || 0}/{cls.maxCapacity || 'Onbeperkt'}
                    </span>
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap">
                    <span className="text-gray-900">{cls.teacherName || '-'}</span>
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap text-right">
                    <QuickActions
                      onView={() => handleViewClass(cls)}
                      onEdit={() => handleEditClass(cls)}
                      onDelete={() => handleDeleteClass(cls)}
                    />
                  </StandardTableCell>
                </StandardTableRow>
              ))
            )}
          </StandardTableBody>
        </StandardTable>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            {filteredClasses.length > 0 && (
              <span>
                {filteredClasses.length} klas{filteredClasses.length !== 1 ? 'sen' : ''} gevonden
                {selectedClasses.length > 0 && ` (${selectedClasses.length} geselecteerd)`}
              </span>
            )}
          </div>
        </div>
      </DataTableContainer>

      {/* Nieuwe klas dialoog */}
      <Dialog open={showNewClassDialog} onOpenChange={setShowNewClassDialog}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <div className="bg-[#1e40af] py-4 px-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <School className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-semibold m-0">Nieuwe Klas Toevoegen</DialogTitle>
                <DialogDescription className="text-white/70 text-sm m-0">
                  Vul de gegevens in om een nieuwe klas toe te voegen.
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <div className="p-6 max-h-[calc(90vh-150px)] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="className" className="text-xs font-medium text-gray-700">
                  Klasnaam <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="className" 
                  placeholder="Bijv. 1A, Wiskunde Gevorderden" 
                  className="h-8 text-sm"
                  value={newClass.name}
                  onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="academicYear" className="text-xs font-medium text-gray-700">
                  Schooljaar <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="academicYear" 
                  placeholder="2025-2026" 
                  className="h-8 text-sm"
                  value={newClass.academicYear}
                  onChange={(e) => setNewClass({...newClass, academicYear: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxCapacity" className="text-xs font-medium text-gray-700">
                  Maximum capaciteit
                </Label>
                <Input 
                  id="maxCapacity" 
                  type="number"
                  placeholder="25" 
                  className="h-8 text-sm"
                  value={newClass.maxCapacity}
                  onChange={(e) => setNewClass({...newClass, maxCapacity: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs font-medium text-gray-700">
                  Locatie van de klas
                </Label>
                <Input 
                  id="location" 
                  placeholder="Bijv. Lokaal 101, Gebouw A" 
                  className="h-8 text-sm"
                  value={newClass.location}
                  onChange={(e) => setNewClass({...newClass, location: e.target.value})}
                />
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Vakken</Label>
                <div className="space-y-2">
                  {/* Dropdown voor beschikbare vakken */}
                  <Select 
                    value="" 
                    onValueChange={(value) => {
                      if (value && !newClass.subjects.includes(parseInt(value))) {
                        setNewClass(prev => ({
                          ...prev,
                          subjects: [...prev.subjects, parseInt(value)]
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm border-gray-300">
                      <SelectValue placeholder="Selecteer een vak om toe te voegen" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Geen vakken beschikbaar. Voeg eerst vakken toe via de Vakken sectie.
                        </SelectItem>
                      ) : programs.filter(program => !newClass.subjects.includes(program.id)).length === 0 ? (
                        <SelectItem value="none" disabled>Alle vakken zijn al toegevoegd</SelectItem>
                      ) : (
                        programs.filter(program => !newClass.subjects.includes(program.id)).map((program: any) => (
                          <SelectItem key={program.id} value={program.id.toString()}>
                            {program.name} ({program.code})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Geselecteerde vakken tonen */}
                  {newClass.subjects.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-500">Geselecteerde vakken:</Label>
                      <div className="flex flex-wrap gap-2">
                        {newClass.subjects.map((subjectId) => {
                          const program = programs.find((p: any) => p.id === subjectId);
                          return program ? (
                            <div key={subjectId} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-sm text-xs">
                              <span>{program.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setNewClass(prev => ({
                                  ...prev,
                                  subjects: prev.subjects.filter(id => id !== subjectId)
                                }))}
                                className="h-4 w-4 p-0 hover:bg-blue-100"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="teacher" className="text-xs font-medium text-gray-700">
                  Klastitularis
                </Label>
                <Select value={newClass.teacherId} onValueChange={(value) => setNewClass({...newClass, teacherId: value})}>
                  <SelectTrigger className="h-8 text-sm border-gray-300">
                    <SelectValue placeholder="Selecteer een docent" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher: any) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.firstName} {teacher.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            
            <div className="mt-4 space-y-2">
              <Label htmlFor="prerequisites" className="text-xs font-medium text-gray-700">
                Instroomvereisten
              </Label>
              <Textarea 
                id="prerequisites" 
                placeholder="Beschrijf de vereisten om deze klas te volgen..."
                className="text-sm resize-none"
                rows={3}
                value={newClass.prerequisites}
                onChange={(e) => setNewClass({...newClass, prerequisites: e.target.value})}
              />
            </div>
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="learningGoals" className="text-xs font-medium text-gray-700">
                Leerdoelen van de klas
              </Label>
              <Textarea 
                id="learningGoals" 
                placeholder="Beschrijf wat studenten moeten kunnen na het succesvol afronden van deze klas..."
                className="text-sm resize-none"
                rows={3}
                value={newClass.learningGoals}
                onChange={(e) => setNewClass({...newClass, learningGoals: e.target.value})}
              />
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-3 flex justify-end gap-2 border-t">
            <Button
              variant="outline"
              onClick={() => setShowNewClassDialog(false)}
              className="h-8 text-xs rounded-sm"
            >
              Annuleren
            </Button>
            <Button
              onClick={handleSaveClass}
              disabled={createClassMutation.isPending}
              className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              Opslaan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bekijk klas dialoog */}
      <CustomDialog 
        open={showViewDialog} 
        onOpenChange={setShowViewDialog}
        maxWidth="1200px"
      >
        <DialogHeaderWithIcon
          title="Klas Details"
          description="Bekijk alle informatie van de geselecteerde klas"
          icon={<Eye className="h-5 w-5" />}
        />
        
        {selectedClass && (
          <DialogFormContainer className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Algemene Informatie */}
              <SectionContainer 
                title="Algemene Informatie" 
                icon={<School className="h-4 w-4" />}
              >
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Klasnaam</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedClass.name}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Schooljaar</label>
                      <p className="text-sm text-gray-900">{selectedClass.academicYear || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Klastitularis</label>
                    <p className="text-sm text-gray-900">{selectedClass.teacherName || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      <Badge variant={selectedClass.isActive ? "default" : "secondary"}>
                        {selectedClass.isActive ? "Actief" : "Inactief"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </SectionContainer>

              {/* Locatie & Capaciteit */}
              <SectionContainer 
                title="Locatie & Capaciteit" 
                icon={<MapPin className="h-4 w-4" />}
              >
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Locatie</label>
                    <p className="text-sm text-gray-900">{selectedClass.location || '-'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Huidige bezetting</label>
                      <p className="text-sm text-gray-900 font-medium">{selectedClass.studentCount || 0}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Max. capaciteit</label>
                      <p className="text-sm text-gray-900">{selectedClass.maxCapacity || 'Onbeperkt'}</p>
                    </div>
                  </div>
                  {selectedClass.maxCapacity && (
                    <div>
                      <label className="text-xs font-medium text-gray-700">Bezettingspercentage</label>
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(((selectedClass.studentCount || 0) / selectedClass.maxCapacity) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(((selectedClass.studentCount || 0) / selectedClass.maxCapacity) * 100)}% bezet
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </SectionContainer>
            </div>

            {/* Vakken/Curriculum */}
            <SectionContainer 
              title="Vakken & Curriculum" 
              icon={<BookOpen className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Toegewezen vakken</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedClass.subjects && selectedClass.subjects.length > 0 ? (
                      selectedClass.subjects.map((subject, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {subject}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Geen vakken toegewezen</p>
                    )}
                  </div>
                </div>
                
                {/* Instroomvereisten en Leerdoelen */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Instroomvereisten</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedClass.prerequisites || 'Geen specifieke vereisten'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Leerdoelen</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedClass.learningGoals || 'Geen leerdoelen gedefinieerd'}
                    </p>
                  </div>
                </div>
              </div>
            </SectionContainer>
          </DialogFormContainer>
        )}
        
        <DialogFooterContainer
          onCancel={() => setShowViewDialog(false)}
          cancelText="Sluiten"
          showSubmitButton={false}
        />
      </CustomDialog>

      {/* Bewerk klas dialoog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <div className="bg-[#1e40af] py-4 px-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-semibold m-0">Klas bewerken</DialogTitle>
                <DialogDescription className="text-white/70 text-sm m-0">
                  Bewerk de gegevens van de geselecteerde klas.
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <div className="p-6 max-h-[calc(90vh-150px)] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">
                  Klasnaam <span className="text-red-500">*</span>
                </Label>
                <Input 
                  name="name"
                  placeholder="Klasnaam" 
                  className="h-8 text-sm"
                  value={editFormData.name || ''}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">
                  Schooljaar <span className="text-red-500">*</span>
                </Label>
                <Input 
                  name="academicYear"
                  placeholder="2025-2026" 
                  className="h-8 text-sm"
                  value={editFormData.academicYear || ''}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Maximum capaciteit</Label>
                <Input 
                  name="maxCapacity"
                  type="number"
                  placeholder="25" 
                  className="h-8 text-sm"
                  value={editFormData.maxCapacity || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) || undefined }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Locatie</Label>
                <Input 
                  name="location"
                  placeholder="Lokaal of gebouw" 
                  className="h-8 text-sm"
                  value={editFormData.location || ''}
                  onChange={handleEditInputChange}
                />
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Vakken</Label>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Voeg vakken toe aan deze klas</p>
                  <Select 
                    value=""
                    onValueChange={(value) => {
                      if (value && !editFormData.subjects?.includes(parseInt(value))) {
                        setEditFormData(prev => ({
                          ...prev,
                          subjects: [...(prev.subjects || []), parseInt(value)]
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm border-gray-300">
                      <SelectValue placeholder="Selecteer een vak om toe te voegen" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Geen vakken beschikbaar
                        </SelectItem>
                      ) : programs
                        .filter(program => !editFormData.subjects?.includes(program.id))
                        .map((program: any) => (
                          <SelectItem key={program.id} value={program.id.toString()}>
                            {program.name} ({program.code})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Geselecteerde vakken weergeven */}
                  {editFormData.subjects && editFormData.subjects.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600">Toegevoegde vakken:</p>
                      <div className="flex flex-wrap gap-1">
                        {editFormData.subjects.map((subjectId: number) => {
                          const program = programs.find((p: any) => p.id === subjectId);
                          return program ? (
                            <Badge 
                              key={subjectId} 
                              variant="secondary" 
                              className="text-xs flex items-center gap-1"
                            >
                              {program.name}
                              <X 
                                className="h-3 w-3 cursor-pointer hover:text-red-500" 
                                onClick={() => {
                                  setEditFormData(prev => ({
                                    ...prev,
                                    subjects: prev.subjects?.filter(id => id !== subjectId) || []
                                  }));
                                }}
                              />
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Klastitularis</Label>
                <Select 
                  value={editFormData.teacherId?.toString() || ''} 
                  onValueChange={(value) => handleEditSelectChange('teacherId', value)}
                >
                  <SelectTrigger className="h-8 text-sm border-gray-300">
                    <SelectValue placeholder="Selecteer een docent" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher: any) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.firstName} {teacher.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <Label className="text-xs font-medium text-gray-700">Instroomvereisten</Label>
              <Textarea 
                name="prerequisites"
                placeholder="Vereisten voor deze klas..."
                className="text-sm resize-none"
                rows={3}
                value={editFormData.prerequisites || ''}
                onChange={handleEditInputChange}
              />
            </div>
            
            <div className="mt-4 space-y-2">
              <Label className="text-xs font-medium text-gray-700">Leerdoelen</Label>
              <Textarea 
                name="learningGoals"
                placeholder="Leerdoelen van deze klas..."
                className="text-sm resize-none"
                rows={3}
                value={editFormData.learningGoals || ''}
                onChange={handleEditInputChange}
              />
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-3 flex justify-end gap-2 border-t">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              className="h-8 text-xs rounded-sm"
            >
              Annuleren
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={updateClassMutation.isPending}
              className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              Opslaan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={() => selectedClass && deleteClassMutation.mutate(selectedClass.id)}
        title="Klas verwijderen"
        description={`Weet je zeker dat je de klas "${selectedClass?.name}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`}
        item={selectedClass ? {
          name: selectedClass.name,
          id: `ID: ${selectedClass.id}`,
          initials: selectedClass.name.substring(0, 2).toUpperCase()
        } : null}
        isLoading={deleteClassMutation.isPending}
      />


    </div>
  );
}