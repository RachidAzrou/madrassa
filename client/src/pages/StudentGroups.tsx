import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Plus, Eye, Edit, Trash2, Users, MapPin, BookOpen, 
  GraduationCap, Target, Filter, Download, X, Save, UserCheck
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { 
  DataTableContainer, 
  SearchActionBar, 
  TableContainer, 
  DataTableHeader,
  ActionButtonsContainer,
  FilterLabel,
  FilterSelect,
  FilterSelectItem,
  QuickActions,
  EmptyTableState,
  TableLoadingState,
  TableErrorState 
} from '@/components/ui/data-table-container';
import { apiRequest } from '@/lib/queryClient';
import { PremiumHeader } from '@/components/layout/premium-header';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { ExportButton } from '@/components/ui/export-button';
import { ExportDialog } from '@/components/ui/export-dialog';

// Custom icon voor klassen
const ChalkBoard = (props: any) => (
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
    {...props}
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

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNewClassDialog, setShowNewClassDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filter states
  const [locationFilter, setLocationFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');

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

  // Filter function
  const filteredClasses = classes.filter((cls: ClassType) => {
    const matchesSearch = !searchQuery || 
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.teacherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation = !locationFilter || cls.location?.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesTeacher = !teacherFilter || cls.teacherName?.toLowerCase().includes(teacherFilter.toLowerCase());
    const matchesAcademicYear = !academicYearFilter || cls.academicYear === academicYearFilter;
    const matchesCapacity = !capacityFilter || (cls.maxCapacity && cls.maxCapacity >= parseInt(capacityFilter));

    return matchesSearch && matchesLocation && matchesTeacher && matchesAcademicYear && matchesCapacity;
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
    setSearchQuery('');
    setLocationFilter('');
    setTeacherFilter('');
    setAcademicYearFilter('');
    setCapacityFilter('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PremiumHeader 
        title="Klassen" 
        path="Beheer > Klassen" 
        icon={ChalkBoard}
        description="Beheer klasgroepen, bekijk studentenlijsten en wijs docenten toe aan klassen"
      />

      <DataTableContainer>
        {/* Search and action bar */}
        <SearchActionBar>
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Zoek klassen op naam, docent of locatie..."
                  className="pl-9 h-8 text-xs bg-white rounded-sm border-[#e5e7eb]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="h-8 text-xs rounded-sm border-[#e5e7eb]"
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                Filters
              </Button>
              
              <ExportButton
                onClick={() => setIsExportDialogOpen(true)}
                title="Exporteer klassen"
              />
              
              <Button
                onClick={() => setShowNewClassDialog(true)}
                size="sm"
                className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Nieuwe Klas
              </Button>
            </div>
          </div>

          {/* Advanced filters */}
          <Collapsible open={showAdvancedFilters}>
            <CollapsibleContent className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-700">Locatie</Label>
                  <Input
                    placeholder="Filter op locatie"
                    className="h-8 text-xs mt-1"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Docent</Label>
                  <Input
                    placeholder="Filter op docent"
                    className="h-8 text-xs mt-1"
                    value={teacherFilter}
                    onChange={(e) => setTeacherFilter(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Academisch jaar</Label>
                  <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Alle jaren" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle jaren</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Min. capaciteit</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    className="h-8 text-xs mt-1"
                    value={capacityFilter}
                    onChange={(e) => setCapacityFilter(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 text-xs"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Wis filters
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </SearchActionBar>

        {/* Classes table */}
        <TableContainer>
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e40af] mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Klassen laden...</p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="text-red-600">Er is een fout opgetreden bij het laden van de klassen.</p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="p-8 text-center">
              <ChalkBoard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen klassen gevonden</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || Object.values({locationFilter, teacherFilter, academicYearFilter, capacityFilter}).some(f => f) 
                  ? "Geen klassen komen overeen met uw zoekcriteria."
                  : "Er zijn nog geen klassen aangemaakt."}
              </p>
              <Button
                onClick={() => setShowNewClassDialog(true)}
                className="bg-[#1e40af] hover:bg-[#1e3a8a]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Eerste Klas Aanmaken
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <DataTableHeader>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">
                    <Checkbox
                      checked={selectedClasses.length === filteredClasses.length && filteredClasses.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedClasses(filteredClasses.map((cls: ClassType) => cls.id));
                        } else {
                          setSelectedClasses([]);
                        }
                      }}
                      className="mr-2"
                    />
                    Klas
                  </th>
                  <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">Locatie</th>
                  <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">Klastitularis</th>
                  <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">Capaciteit</th>
                  <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">Status</th>
                  <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-right">Acties</th>
                </tr>
              </DataTableHeader>
              <tbody>
                {filteredClasses.map((cls: ClassType) => (
                  <tr 
                    key={cls.id} 
                    className="border-b border-gray-100 hover:bg-gray-50 group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Checkbox
                          checked={selectedClasses.includes(cls.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedClasses([...selectedClasses, cls.id]);
                            } else {
                              setSelectedClasses(selectedClasses.filter(id => id !== cls.id));
                            }
                          }}
                          className="mr-3"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{cls.name}</p>
                          <p className="text-xs text-gray-500">{cls.academicYear}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {cls.location || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {cls.teacherName || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-900">
                      {cls.studentCount || 0}/{cls.maxCapacity || 'Onbeperkt'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={cls.isActive ? "default" : "secondary"}
                        className={cls.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {cls.isActive ? 'Actief' : 'Inactief'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <QuickActions
                        onView={() => handleViewClass(cls)}
                        onEdit={() => handleEditClass(cls)}
                        onDelete={() => handleDeleteClass(cls)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableContainer>

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
                <ChalkBoard className="h-5 w-5 text-white" />
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
              <Label className="text-xs font-medium text-gray-700">Vakken</Label>
              <div className="space-y-2">
                {/* Dropdown voor beschikbare vakken */}
                <Select value="" onValueChange={(value) => addSubjectToNewClass(parseInt(value))}>
                  <SelectTrigger className="h-8 text-sm border-gray-300">
                    <SelectValue placeholder="Selecteer een vak om toe te voegen" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.filter(course => !newClass.subjects.includes(course.id)).map((course: any) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.name} ({course.code})
                      </SelectItem>
                    ))}
                    {courses.filter(course => !newClass.subjects.includes(course.id)).length === 0 && (
                      <SelectItem value="none" disabled>Alle vakken zijn al toegevoegd</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                {/* Geselecteerde vakken tonen */}
                {newClass.subjects.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-500">Geselecteerde vakken:</Label>
                    <div className="flex flex-wrap gap-2">
                      {newClass.subjects.map((subjectId) => {
                        const course = courses.find((c: any) => c.id === subjectId);
                        return course ? (
                          <div key={subjectId} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-sm text-xs">
                            <span>{course.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSubjectFromNewClass(subjectId)}
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
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
          <div className="bg-[#1e40af] py-4 px-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-semibold m-0">Klas bekijken</DialogTitle>
                <DialogDescription className="text-white/70 text-sm m-0">
                  Bekijk de details van de geselecteerde klas.
                </DialogDescription>
              </div>
            </div>
          </div>
          
          {selectedClass && (
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <ChalkBoard className="h-4 w-4 mr-2" />
                      Basisinformatie
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700">Klasnaam</label>
                        <p className="text-sm text-gray-900">{selectedClass.name}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">Locatie</label>
                        <p className="text-sm text-gray-900">{selectedClass.location || '-'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">Capaciteit</label>
                        <p className="text-sm text-gray-900">
                          {selectedClass.studentCount || 0}/{selectedClass.maxCapacity || 'Onbeperkt'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">Klastitularis</label>
                        <p className="text-sm text-gray-900">{selectedClass.teacherName || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Vakken
                    </h3>
                    <div className="space-y-2">
                      {selectedClass.subjects && selectedClass.subjects.length > 0 ? (
                        selectedClass.subjects.map((subject, index) => (
                          <Badge key={index} variant="outline" className="mr-1 mb-1">
                            {subject}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Geen vakken toegewezen</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                  <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Instroomvereisten
                  </h3>
                  <p className="text-sm text-gray-900">
                    {selectedClass.prerequisites || 'Geen specifieke vereisten'}
                  </p>
                </div>
                
                <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                  <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Leerdoelen
                  </h3>
                  <p className="text-sm text-gray-900">
                    {selectedClass.learningGoals || 'Geen leerdoelen gedefinieerd'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 px-6 py-3 flex justify-end gap-2 border-t">
            <Button
              variant="outline"
              onClick={() => setShowViewDialog(false)}
              className="h-8 text-xs rounded-sm"
            >
              Sluiten
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                <Label className="text-xs font-medium text-gray-700">Locatie</Label>
                <Input 
                  name="location"
                  placeholder="Lokaal of gebouw" 
                  className="h-8 text-sm"
                  value={editFormData.location || ''}
                  onChange={handleEditInputChange}
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
        isLoading={deleteClassMutation.isPending}
      />

      {/* Export dialog */}
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        title="Klassen exporteren"
        description="Exporteer de klassenlijst naar het gewenste formaat."
        data={filteredClasses}
        filename="klassen"
      />
    </div>
  );
}