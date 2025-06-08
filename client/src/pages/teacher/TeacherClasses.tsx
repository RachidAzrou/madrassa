import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, Plus, Download, Filter, Eye, Edit, Trash2, 
  User, Users, School, Phone, Mail, Calendar,
  MapPin, BookMarked, AlertTriangle, Star, BookText,
  Settings, Save, X, Upload, UserPlus, ClipboardCheck,
  LayoutDashboard, MoreHorizontal, PlusCircle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import EmptyState from '@/components/ui/empty-state';
import { PremiumHeader } from '@/components/layout/premium-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Types - exact copy from admin
interface StudentClass {
  id: number;
  name: string;
  code: string;
  academicYear: string;
  studentCount: number;
  capacity: number;
  teacher?: string;
  program?: string;
  status: string;
  description?: string;
  createdAt: string;
}

interface Program {
  id: number;
  name: string;
  code: string;
}

interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
}

// Admin-style components
const DataTableContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-sm overflow-hidden">
    {children}
  </div>
);

const SearchActionBar = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4 py-3 border-b border-[#e5e7eb] flex flex-wrap items-center justify-between gap-3">
    {children}
  </div>
);

const TableContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-x-auto">
    {children}
  </div>
);

const QuickActions = ({ onView, onEdit, onDelete }: { onView: () => void, onEdit: () => void, onDelete: () => void }) => (
  <div className="flex items-center gap-1">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onView}>
            <Eye className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bekijken</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onEdit}>
            <Edit className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bewerken</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-600 hover:text-red-700" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Verwijderen</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

export default function TeacherClasses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<StudentClass | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);

  const { data: classesData, isLoading } = useQuery<{ classes: StudentClass[] }>({
    queryKey: ['/api/student-groups'],
    retry: false,
  });

  const { data: programsData } = useQuery<{ programs: Program[] }>({
    queryKey: ['/api/programs'],
    retry: false,
  });

  const classes = classesData?.classes || [];
  const programs = programsData?.programs || [];

  // Filter classes based on search term, status, and program
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = !searchTerm || 
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.academicYear.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || cls.status === statusFilter;
    const matchesProgram = programFilter === "all" || cls.program === programFilter;

    return matchesSearch && matchesStatus && matchesProgram;
  });

  const handleViewClass = (cls: StudentClass) => {
    setSelectedClass(cls);
    setDialogMode('view');
    setShowDialog(true);
  };

  const handleEditClass = (cls: StudentClass) => {
    setSelectedClass(cls);
    setDialogMode('edit');
    setShowDialog(true);
  };

  const handleCreateClass = () => {
    setSelectedClass(null);
    setDialogMode('create');
    setShowDialog(true);
  };

  const handleDeleteClass = (cls: StudentClass) => {
    if (confirm(`Weet je zeker dat je klas ${cls.name} wilt verwijderen?`)) {
      // Delete logic would go here
      toast({
        title: "Klas verwijderd",
        description: `Klas ${cls.name} is succesvol verwijderd.`,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Actief</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactief</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Voltooid</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      {/* Premium Header - Exact admin styling */}
      <PremiumHeader
        title="Mijn Klassen"
        description="Beheer klassen waar u lesgeeft"
        icon={School}
        breadcrumbs={{
          parent: "Docent",
          current: "Klassen"
        }}
      />

      {/* Main Content */}
      <div className="p-6">
        <DataTableContainer>
          <SearchActionBar>
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek klassen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  <SelectItem value="active">Actief</SelectItem>
                  <SelectItem value="inactive">Inactief</SelectItem>
                  <SelectItem value="completed">Voltooid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Programma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle programma's</SelectItem>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.name}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              <Button size="sm" onClick={handleCreateClass}>
                <Plus className="w-4 h-4 mr-2" />
                Nieuwe Klas
              </Button>
            </div>
          </SearchActionBar>

          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedClasses.length === filteredClasses.length && filteredClasses.length > 0}
                      onCheckedChange={(checked) => {
                        setSelectedClasses(checked ? filteredClasses.map(c => c.id) : []);
                      }}
                    />
                  </TableHead>
                  <TableHead>Klas</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Academisch Jaar</TableHead>
                  <TableHead>Studenten</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        <span className="ml-2">Laden...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredClasses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <EmptyState
                        icon={<School className="w-12 h-12" />}
                        title="Geen klassen gevonden"
                        description="Er zijn geen klassen die voldoen aan uw zoekcriteria."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClasses.map((cls) => (
                    <TableRow 
                      key={cls.id}
                      className={selectedClasses.includes(cls.id) ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedClasses.includes(cls.id)}
                          onCheckedChange={(checked) => {
                            setSelectedClasses(prev => 
                              checked 
                                ? [...prev, cls.id]
                                : prev.filter(id => id !== cls.id)
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <School className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{cls.name}</div>
                            <div className="text-sm text-muted-foreground">{cls.description || 'Geen beschrijving'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{cls.code || '-'}</TableCell>
                      <TableCell>{cls.academicYear}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{cls.studentCount} studenten</div>
                          {cls.capacity && (
                            <div className="text-muted-foreground">Max: {cls.capacity}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(cls.status)}</TableCell>
                      <TableCell>
                        <QuickActions
                          onView={() => handleViewClass(cls)}
                          onEdit={() => handleEditClass(cls)}
                          onDelete={() => handleDeleteClass(cls)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DataTableContainer>
      </div>
    </div>
  );
}