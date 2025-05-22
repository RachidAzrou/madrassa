import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Search, PlusCircle, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ManageStudentEnrollmentsProps {
  groupId: number;
  onClose?: () => void;
}

export default function ManageStudentEnrollments({ groupId, onClose }: ManageStudentEnrollmentsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch group information
  const { data: group, isLoading: isGroupLoading } = useQuery({
    queryKey: ['/api/student-groups', groupId],
    enabled: !!groupId,
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/student-groups/${groupId}`);
        return response;
      } catch (error) {
        console.error('Error fetching group:', error);
        return null;
      }
    }
  });

  // Fetch all students
  const { data: studentsData, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['/api/students'],
    staleTime: 60000,
  });

  // Fetch current enrollments for this group
  const { data: enrollmentsData, isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ['/api/student-groups', groupId, 'enrollments'],
    enabled: !!groupId,
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/student-groups/${groupId}/enrollments`);
        return response;
      } catch (error) {
        console.error('Error fetching enrollments:', error);
        return [];
      }
    }
  });

  // Check if we have data
  const students = Array.isArray(studentsData) ? studentsData : [];
  const enrollments = Array.isArray(enrollmentsData) ? enrollmentsData : [];

  // Track enrolled student IDs for quick lookups
  const [enrolledStudentIds, setEnrolledStudentIds] = useState<number[]>([]);

  // Update enrolled students when enrollments data changes
  useEffect(() => {
    if (enrollments && enrollments.length > 0) {
      setEnrolledStudentIds(enrollments.map((e: any) => e.studentId));
    } else {
      setEnrolledStudentIds([]);
    }
  }, [enrollments]);

  // Filter students based on search term and get non-enrolled students
  const filteredStudents = students.filter(student => 
    (student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toString().includes(searchTerm.toLowerCase())) &&
    !enrolledStudentIds.includes(student.id)
  );

  // Filter to get only enrolled students
  const enrolledStudents = students.filter(student => 
    enrolledStudentIds.includes(student.id)
  );

  // Mutation to add student to group
  const addEnrollmentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      return await apiRequest('/api/student-group-enrollments', {
        method: 'POST',
        body: {
          studentId,
          groupId,
          status: 'active',
          enrollmentDate: new Date().toISOString()
        }
      });
    },
    onSuccess: () => {
      toast({
        title: 'Student toegevoegd',
        description: 'De student is succesvol aan de klas toegevoegd.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student-groups', groupId, 'enrollments'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout bij toevoegen',
        description: error?.message || 'Er is een fout opgetreden bij het toevoegen van de student.',
        variant: 'destructive',
      });
    }
  });

  // Mutation to remove student from group
  const removeEnrollmentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      // First find the enrollment ID
      const enrollment = enrollments.find((e: any) => e.studentId === studentId);
      if (!enrollment) throw new Error('Inschrijving niet gevonden');
      
      return await apiRequest(`/api/student-group-enrollments/${enrollment.id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Student verwijderd',
        description: 'De student is succesvol uit de klas verwijderd.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student-groups', groupId, 'enrollments'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout bij verwijderen',
        description: error?.message || 'Er is een fout opgetreden bij het verwijderen van de student.',
        variant: 'destructive',
      });
    }
  });

  const handleAddStudent = (studentId: number) => {
    addEnrollmentMutation.mutate(studentId);
  };

  const handleRemoveStudent = (studentId: number) => {
    removeEnrollmentMutation.mutate(studentId);
  };

  // Loading state
  if (isGroupLoading || isStudentsLoading || isEnrollmentsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2">Gegevens laden...</p>
      </div>
    );
  }

  // Error state if group not found
  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium">Klas niet gevonden</h3>
        <p className="text-gray-500">De geselecteerde klas kon niet worden geladen.</p>
        {onClose && (
          <Button onClick={onClose} className="mt-4">
            Sluiten
          </Button>
        )}
      </div>
    );
  }

  // Current enrolled count vs capacity
  const enrolledCount = enrolledStudentIds.length;
  const capacityWarning = group.maxCapacity && enrolledCount >= group.maxCapacity;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">{group.name}</h2>
          <p className="text-gray-500">
            {group.academicYear} • {enrolledCount} student{enrolledCount !== 1 ? 'en' : ''}
            {group.maxCapacity ? ` / ${group.maxCapacity} plaatsen` : ''}
          </p>
          {capacityWarning && (
            <Badge variant="outline" className="mt-1 text-amber-500 border-amber-200 bg-amber-50">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Maximale capaciteit bereikt
            </Badge>
          )}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Zoek studenten..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      <div className="border rounded-md bg-white">
        <div className="p-3 bg-gray-50 border-b">
          <h4 className="font-medium">Ingeschreven studenten</h4>
        </div>
        {enrolledStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Er zijn nog geen studenten ingeschreven voor deze klas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12 font-medium">#</TableHead>
                  <TableHead className="font-medium">Student</TableHead>
                  <TableHead className="font-medium">ID</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="w-20 text-right font-medium">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrolledStudents.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {student.firstName[0]}{student.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.firstName} {student.lastName}</div>
                          <div className="text-xs text-gray-500">{student.email || 'Geen e-mail'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Actief
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStudent(student.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Verwijderen</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="border rounded-md bg-white">
        <div className="p-3 bg-gray-50 border-b">
          <h4 className="font-medium">Beschikbare studenten</h4>
          <p className="text-sm text-gray-500">Voeg studenten toe aan deze klas.</p>
        </div>
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Geen studenten gevonden of alle beschikbare studenten zijn al ingeschreven.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-medium">Student</TableHead>
                  <TableHead className="font-medium">ID</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="w-20 text-right font-medium">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {student.firstName[0]}{student.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.firstName} {student.lastName}</div>
                          <div className="text-xs text-gray-500">{student.email || 'Geen e-mail'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>
                      <Badge variant={student.isActive ? "outline" : "secondary"} className={student.isActive ? "bg-blue-50 text-blue-700 border-blue-200" : ""}>
                        {student.isActive ? 'Actief' : 'Inactief'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddStudent(student.id)}
                        disabled={capacityWarning}
                        className="h-8 w-8 p-0 text-green-500 hover:text-green-700 hover:bg-green-50"
                        title={capacityWarning ? "Klas heeft maximale capaciteit bereikt" : "Toevoegen aan klas"}
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only">Toevoegen</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}