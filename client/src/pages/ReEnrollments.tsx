import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Download, Filter, Eye, Edit, Trash2, 
  User, Users, GraduationCap, Phone, Mail, Calendar,
  MapPin, FileText, AlertTriangle, Star, BookOpen,
  Settings, Save, X, Upload, UserPlus, NotebookText,
  Home, MoreHorizontal, PlusCircle, ClipboardCheck,
  TrendingUp, Award, Clock, RefreshCw, CheckCircle,
  XCircle, AlertCircle, Zap
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/lib/queryClient';
import { 
  AdminPageLayout, 
  AdminPageHeader, 
  AdminStatsGrid, 
  AdminStatCard, 
  AdminSearchBar, 
  AdminTableCard,
  AdminFilterSelect,
  AdminActionButton
} from '@/components/ui/admin-layout';

// Types
interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  status: string;
  classId?: number;
  className?: string;
  guardianName?: string;
  eligibleForReEnrollment?: boolean;
  currentYear?: string;
  nextYear?: string;
  photoUrl?: string;
}

interface ReEnrollmentStats {
  totalEligible: number;
  completed: number;
  pending: number;
  declined: number;
  conversionRate: number;
}

interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface Class {
  id: number;
  name: string;
  academicYearId: number;
  capacity: number;
  currentEnrollment: number;
}

export default function ReEnrollments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch eligible students
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students/eligible-for-reenrollment']
  });

  // Fetch stats
  const { data: stats } = useQuery<ReEnrollmentStats>({
    queryKey: ['/api/re-enrollment/stats']
  });

  // Fetch next year classes
  const { data: nextYearClasses = [] } = useQuery<Class[]>({
    queryKey: ['/api/classes/next-year']
  });

  // Bulk re-enrollment mutation
  const bulkReEnrollMutation = useMutation({
    mutationFn: async (data: { studentIds: number[], classId: number, academicYearId: number }) => {
      return apiRequest('POST', '/api/re-enrollments/bulk', data);
    },
    onSuccess: () => {
      toast({
        title: "Herinschrijving succesvol",
        description: "De geselecteerde leerlingen zijn succesvol heringeschreven.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students/eligible-for-reenrollment'] });
      queryClient.invalidateQueries({ queryKey: ['/api/re-enrollment/stats'] });
      setSelectedStudents([]);
      setShowBulkDialog(false);
    },
    onError: () => {
      toast({
        title: "Fout bij herinschrijving",
        description: "Er is een fout opgetreden bij het herinschrijven van de leerlingen.",
        variant: "destructive",
      });
    }
  });

  const handleBulkReEnroll = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "Geen leerlingen geselecteerd",
        description: "Selecteer eerst leerlingen om in te schrijven.",
        variant: "destructive",
      });
      return;
    }
    setShowBulkDialog(true);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'eligible' && student.eligibleForReEnrollment) ||
      (selectedStatus === 'not-eligible' && !student.eligibleForReEnrollment);
    
    const matchesClass = selectedClass === 'all' || student.className === selectedClass;
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId: number, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  if (isLoading) {
    return (
      <AdminPageLayout>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AdminPageLayout>
    );
  }

  return (
    <AdminPageLayout>
      {/* Header */}
      <AdminPageHeader 
        title="Herinschrijvingen" 
        description="Beheer herinschrijvingen voor het nieuwe schooljaar"
      >
        <div className="flex gap-2">
          <AdminActionButton 
            icon={<RefreshCw />}
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/students/eligible-for-reenrollment'] })}
          >
            Vernieuwen
          </AdminActionButton>
          <AdminActionButton 
            icon={<CheckCircle />}
            onClick={handleBulkReEnroll}
            disabled={selectedStudents.length === 0}
          >
            Bulk Herinschrijven ({selectedStudents.length})
          </AdminActionButton>
          <AdminActionButton icon={<Download />}>
            Export
          </AdminActionButton>
        </div>
      </AdminPageHeader>

      {/* Stats Grid */}
      <AdminStatsGrid>
        <AdminStatCard
          title="Totaal Geschikt"
          value={stats?.totalEligible || 0}
          icon={<Users className="h-4 w-4" />}
        />
        <AdminStatCard
          title="Voltooid"
          value={stats?.completed || 0}
          icon={<CheckCircle className="h-4 w-4" />}
          valueColor="text-green-600"
        />
        <AdminStatCard
          title="In Behandeling"
          value={stats?.pending || 0}
          icon={<Clock className="h-4 w-4" />}
          valueColor="text-orange-600"
        />
        <AdminStatCard
          title="Conversie Rate"
          value={`${stats?.conversionRate || 0}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          valueColor="text-blue-600"
        />
      </AdminStatsGrid>

      {/* Search and Filters */}
      <AdminSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Zoeken op naam, leerlingnummer of email..."
        filters={
          <>
            <AdminFilterSelect
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              placeholder="Status"
              options={[
                { value: 'all', label: 'Alle statussen' },
                { value: 'eligible', label: 'Geschikt' },
                { value: 'not-eligible', label: 'Niet geschikt' }
              ]}
            />
            <AdminFilterSelect
              value={selectedClass}
              onValueChange={setSelectedClass}
              placeholder="Huidige Klas"
              options={[
                { value: 'all', label: 'Alle klassen' },
                { value: '1A', label: '1A' },
                { value: '1B', label: '1B' },
                { value: '2A', label: '2A' },
                { value: '2B', label: '2B' }
              ]}
            />
          </>
        }
      />

      {/* Main Table */}
      <AdminTableCard 
        title="Herinschrijvingskandidaten" 
        subtitle={`${filteredStudents.length} leerlingen gevonden`}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Leerling</TableHead>
              <TableHead>Leerlingnummer</TableHead>
              <TableHead>Huidige Klas</TableHead>
              <TableHead>Volgende Klas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Contactgegevens</TableHead>
              <TableHead>Voogd</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={(checked) => handleSelectStudent(student.id, !!checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={student.photoUrl} />
                      <AvatarFallback className="text-xs">
                        {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{student.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">{student.studentId}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{student.className || '-'}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-green-600">{student.nextYear || 'Te bepalen'}</span>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={student.eligibleForReEnrollment ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {student.eligibleForReEnrollment ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Geschikt
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Niet geschikt
                      </span>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Phone className="h-3 w-3" />
                      {student.phone || '-'}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{student.guardianName || '-'}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            disabled={!student.eligibleForReEnrollment}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Herinschrijven</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredStudents.length === 0 && (
          <div className="p-8 text-center">
            <EmptyState
              icon={<RefreshCw className="h-12 w-12" />}
              title="Geen kandidaten gevonden"
              description="Er zijn geen leerlingen die voldoen aan de zoekfilters."
            />
          </div>
        )}
      </AdminTableCard>

      {/* Bulk Re-enrollment Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Bulk Herinschrijving
            </DialogTitle>
            <DialogDescription>
              Schrijf {selectedStudents.length} geselecteerde leerlingen in voor het nieuwe schooljaar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nextYearClass">Selecteer klas voor volgend jaar</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Kies een klas..." />
                </SelectTrigger>
                <SelectContent>
                  {nextYearClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name} ({cls.currentEnrollment}/{cls.capacity} leerlingen)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Let op</p>
                  <p className="text-blue-700">
                    Deze actie schrijft alle geselecteerde leerlingen in één keer in. 
                    Deze actie kan niet ongedaan worden gemaakt.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={() => {
                // Here you would call the bulk enrollment with the selected class
                bulkReEnrollMutation.mutate({
                  studentIds: selectedStudents,
                  classId: 1, // This should come from the selected class
                  academicYearId: 2 // This should come from the next academic year
                });
              }}
              disabled={bulkReEnrollMutation.isPending}
            >
              {bulkReEnrollMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {bulkReEnrollMutation.isPending ? 'Bezig met inschrijven...' : 'Bevestigen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}