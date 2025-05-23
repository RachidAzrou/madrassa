import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Search, PlusCircle, AlertTriangle, UserRound, Phone, Mail } from 'lucide-react';
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

interface ManageStudentGuardiansProps {
  studentId: number;
  onClose?: () => void;
  readonly?: boolean;
}

export default function ManageStudentGuardians({ studentId, onClose, readonly = false }: ManageStudentGuardiansProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch student information
  const { data: student, isLoading: isStudentLoading } = useQuery({
    queryKey: ['/api/students', studentId],
    enabled: !!studentId,
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/students/${studentId}`);
        return response;
      } catch (error) {
        console.error('Error fetching student:', error);
        return null;
      }
    }
  });

  // Fetch all guardians
  const { data: guardiansData, isLoading: isGuardiansLoading } = useQuery({
    queryKey: ['/api/guardians'],
    staleTime: 60000,
  });

  // Fetch current guardian links for this student
  const { data: studentGuardiansData, isLoading: isStudentGuardiansLoading } = useQuery({
    queryKey: ['/api/students', studentId, 'guardians'],
    enabled: !!studentId,
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/students/${studentId}/guardians`);
        return response;
      } catch (error) {
        console.error('Error fetching guardian relationships:', error);
        return [];
      }
    }
  });

  // Check if we have data
  const guardians = Array.isArray(guardiansData) ? guardiansData : [];
  const studentGuardians = Array.isArray(studentGuardiansData) ? studentGuardiansData : [];

  // Track linked guardian IDs for quick lookups
  const [linkedGuardianIds, setLinkedGuardianIds] = useState<number[]>([]);

  // Update linked guardians when data changes
  useEffect(() => {
    if (studentGuardians && studentGuardians.length > 0) {
      setLinkedGuardianIds(studentGuardians.map((sg: any) => sg.guardianId));
    } else {
      setLinkedGuardianIds([]);
    }
  }, [studentGuardians]);

  // Filter guardians based on search term and get non-linked guardians
  const filteredGuardians = guardians.filter(guardian => 
    (guardian.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guardian.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (guardian.email && guardian.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (guardian.phone && guardian.phone.includes(searchTerm))) &&
    !linkedGuardianIds.includes(guardian.id)
  );

  // Filter to get only linked guardians
  const linkedGuardians = guardians.filter(guardian => 
    linkedGuardianIds.includes(guardian.id)
  );

  // Mutation to add guardian to student
  const addGuardianLinkMutation = useMutation({
    mutationFn: async (guardianId: number) => {
      return await apiRequest('/api/student-guardians', {
        method: 'POST',
        body: {
          studentId,
          guardianId,
          relationshipType: 'Voogd', // Default relationship type, can be expanded later
          isPrimary: linkedGuardianIds.length === 0, // If this is the first guardian, make them primary
          hasEmergencyContact: true, // Default to true for emergency contact
          notes: ''
        }
      });
    },
    onSuccess: () => {
      toast({
        title: 'Voogd toegevoegd',
        description: 'De voogd is succesvol aan de student gekoppeld.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students', studentId, 'guardians'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout bij toevoegen',
        description: error?.message || 'Er is een fout opgetreden bij het koppelen van de voogd.',
        variant: 'destructive',
      });
    }
  });

  // Mutation to remove guardian from student
  const removeGuardianLinkMutation = useMutation({
    mutationFn: async (guardianId: number) => {
      // First find the studentGuardian ID
      const studentGuardian = studentGuardians.find((sg: any) => sg.guardianId === guardianId);
      if (!studentGuardian) throw new Error('Koppeling niet gevonden');
      
      return await apiRequest(`/api/student-guardians/${studentGuardian.id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Voogd ontkoppeld',
        description: 'De voogd is succesvol van de student ontkoppeld.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students', studentId, 'guardians'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout bij ontkoppelen',
        description: error?.message || 'Er is een fout opgetreden bij het ontkoppelen van de voogd.',
        variant: 'destructive',
      });
    }
  });

  const handleAddGuardian = (guardianId: number) => {
    addGuardianLinkMutation.mutate(guardianId);
  };

  const handleRemoveGuardian = (guardianId: number) => {
    removeGuardianLinkMutation.mutate(guardianId);
  };

  // Loading state
  if (isStudentLoading || isGuardiansLoading || isStudentGuardiansLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2">Gegevens laden...</p>
      </div>
    );
  }

  // Error state if student not found
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium">Student niet gevonden</h3>
        <p className="text-gray-500">De geselecteerde student kon niet worden geladen.</p>
        {onClose && (
          <Button onClick={onClose} className="mt-4">
            Sluiten
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">{student.firstName} {student.lastName}</h2>
          <p className="text-gray-500">
            {student.studentId} • {linkedGuardians.length} voogd{linkedGuardians.length !== 1 ? 'en' : ''}
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Zoek voogden..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      <div className="border rounded-md bg-white">
        <div className="p-3 bg-gray-50 border-b">
          <h4 className="font-medium">Gekoppelde voogden</h4>
        </div>
        {linkedGuardians.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Er zijn nog geen voogden gekoppeld aan deze student.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12 font-medium">#</TableHead>
                  <TableHead className="font-medium">Voogd</TableHead>
                  <TableHead className="font-medium">Contact</TableHead>
                  <TableHead className="font-medium">Relatie</TableHead>
                  <TableHead className="w-20 text-right font-medium">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkedGuardians.map((guardian, index) => {
                  // Find the specific relationship details
                  const relationship = studentGuardians.find((sg: any) => sg.guardianId === guardian.id);
                  
                  return (
                    <TableRow key={guardian.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {guardian.firstName[0]}{guardian.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{guardian.firstName} {guardian.lastName}</div>
                            {relationship?.isPrimary && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                Primaire voogd
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          {guardian.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1" /> {guardian.phone}
                            </div>
                          )}
                          {guardian.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-1" /> {guardian.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          {relationship?.relationshipType || 'Voogd'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGuardian(guardian.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Verwijderen</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="border rounded-md bg-white">
        <div className="p-3 bg-gray-50 border-b">
          <h4 className="font-medium">Beschikbare voogden</h4>
          <p className="text-sm text-gray-500">Voeg voogden toe aan deze student.</p>
        </div>
        {filteredGuardians.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Geen voogden gevonden of alle beschikbare voogden zijn al gekoppeld.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/guardians?action=add'}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nieuwe voogd aanmaken
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-medium">Voogd</TableHead>
                  <TableHead className="font-medium">Contact</TableHead>
                  <TableHead className="w-20 text-right font-medium">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuardians.map((guardian) => (
                  <TableRow key={guardian.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {guardian.firstName[0]}{guardian.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{guardian.firstName} {guardian.lastName}</div>
                          <div className="text-xs text-gray-500">{guardian.city || 'Geen locatie'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        {guardian.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1" /> {guardian.phone}
                          </div>
                        )}
                        {guardian.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1" /> {guardian.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddGuardian(guardian.id)}
                        className="h-8 w-8 p-0 text-green-500 hover:text-green-700 hover:bg-green-50"
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