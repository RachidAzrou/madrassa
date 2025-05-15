import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, X, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StudentPrograms from '@/components/students/StudentPrograms';

// Hulpfunctie om data in correct formaat te zetten voor API
const formatDateForApi = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null;
  
  // Als datum al in YYYY-MM-DD formaat is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Als datum in DD-MM-YYYY formaat is (zoals van datepicker)
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  }
  
  // Probeert datum om te zetten via Date object
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.error('Ongeldige datumwaarde:', dateString);
  }
  
  return null;
};

export default function Students() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [program, setProgram] = useState('all');
  const [studentGroup, setStudentGroup] = useState('all');
  const [status, setStatus] = useState('all');
  const [nameSort, setNameSort] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  
  // State voor student dialogen
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  // State voor familie tab
  const [linkedGuardians, setLinkedGuardians] = useState<any[]>([]);
  const [siblings, setSiblings] = useState<any[]>([]);
  const [isLinkGuardianDialogOpen, setIsLinkGuardianDialogOpen] = useState(false);
  const [isCreateGuardianDialogOpen, setIsCreateGuardianDialogOpen] = useState(false);
  const [availableGuardians, setAvailableGuardians] = useState<any[]>([]);
  const [selectedGuardianId, setSelectedGuardianId] = useState<number | null>(null);
  const [guardianRelationType, setGuardianRelationType] = useState('parent');
  const [isEmergencyContact, setIsEmergencyContact] = useState(false);
  const [studentFormData, setStudentFormData] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '' as string | null,
    address: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    programId: null as number | null,
    yearLevel: null as number | null,
    enrollmentDate: '',
    status: 'active' as string,
    notes: '',
  });
  
  // State voor meerdere programma's
  const [selectedPrograms, setSelectedPrograms] = useState<{
    programId: number;
    yearLevel: number | null;
    status: string;
  }[]>([]);
  
  // Aangepaste onValueChange voor programId selecties
  const handleProgramIdChange = (value: string) => {
    // Als er een nieuw programma wordt geselecteerd, reset de studiejaar waarde
    setStudentFormData({ 
      ...studentFormData, 
      programId: value && value !== "none" ? parseInt(value) : null,
      // Reset het studiejaar als het programma wijzigt
      yearLevel: null
    });
  };

  // Aangepaste onValueChange voor yearLevel selecties
  const handleYearLevelChange = (value: string) => {
    setStudentFormData({ 
      ...studentFormData, 
      yearLevel: value && value !== "none" ? parseInt(value) : null 
    });
  };
  
  // Functie om studiejaren te genereren op basis van programma duur
  const getYearLevelOptions = (programId: number | null): number[] => {
    if (!programId) return [];
    
    // Zoek het geselecteerde programma op
    const selectedProgram = programsData?.find((p: any) => p.id === programId);
    
    // Als het programma gevonden is, maak dan een array met jaren van 1 tot en met de duur
    if (selectedProgram) {
      return Array.from({length: selectedProgram.duration}, (_, i) => i + 1);
    }
    
    return [];
  };

  // Fetch programs for dropdown and display
  const { data: programsData } = useQuery({
    queryKey: ['/api/programs'],
    staleTime: 30000,
  });
  
  // Programma's ophalen voor weergave en dropdown
  const programs = Array.isArray(programsData) ? programsData : programsData?.programs || [];
  
  // Fetch student groups for dropdown
  const { data: studentGroupsData } = useQuery({
    queryKey: ['/api/student-groups'],
    staleTime: 30000,
  });
  
  const studentGroups = studentGroupsData?.studentGroups || [];
  
  // Fetch students with filters
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/students', { searchTerm, program, studentGroup, status, nameSort, page: currentPage }],
    staleTime: 30000,
  });

  // Als data direct een array is, gebruik het; anders zoek naar data.students
  const students = Array.isArray(data) ? data : data?.students || [];
  
  // Totaal aantal studenten is de lengte van de array als we geen expliciete totalCount hebben
  const totalStudents = data?.totalCount || students.length || 0;
  const totalPages = Math.ceil(totalStudents / 10); // Assuming 10 students per page
  
  // Calculate ages from dateOfBirth
  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  // Function to get student group name by student id
  const getStudentGroupName = (studentId: number) => {
    // In de toekomst dit vervangen door een echte query of relatie
    // For now, we'll retrieve from studentGroupsEnrollments when available
    return "Onbekend";
  };

  // Sorteer studenten op basis van de huidige sorteerrichting
  const sortedStudents = [...students].sort((a, b) => {
    // Standaard sorteren op naam
    const nameCompare = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    return nameSort === 'asc' ? nameCompare : -nameCompare;
  });

  // Mutatie om een student toe te voegen
  const createStudentMutation = useMutation({
    mutationFn: async (studentData: typeof studentFormData) => {
      const response = await apiRequest('POST', '/api/students', studentData);
      
      // Nu studentId-programma associaties toevoegen als er programma's zijn geselecteerd
      if (selectedPrograms.length > 0 && response.id) {
        // Voor elk programma, een student_program record maken
        const programPromises = selectedPrograms.map(program => 
          apiRequest('POST', '/api/student-programs', {
            studentId: response.id,
            programId: program.programId,
            yearLevel: program.yearLevel,
            status: program.status,
            enrollmentDate: new Date().toISOString().split('T')[0],
            primaryProgram: selectedPrograms.indexOf(program) === 0 // Eerste programma is primair
          })
        );
        
        // Wacht tot alle programma's zijn toegevoegd
        await Promise.all(programPromises);
      }
      
      return response;
    },
    onSuccess: () => {
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      
      // Reset form en geselecteerde programma's en sluit dialoog
      setStudentFormData({
        studentId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        address: '',
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        programId: null,
        yearLevel: null,
        enrollmentDate: '',
        status: 'Active',
        notes: '',
      });
      setSelectedPrograms([]); // Reset geselecteerde programma's
      setIsAddDialogOpen(false);
      
      // Toon succes melding
      toast({
        title: "Student toegevoegd",
        description: "De student is succesvol toegevoegd aan het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error("Student toevoegfout:", error);
      
      // Probeer meer gedetailleerde foutinformatie te krijgen
      let errorMessage = "Er is een fout opgetreden bij het toevoegen van de student.";
      let errorDetail = "";
      
      try {
        // Voor de 409 Conflict fouten (zoals duplicaat e-mail), tonen we de gedetailleerde informatie
        if (error.message && error.message.startsWith("409:")) {
          try {
            // Probeer de JSON foutmelding te parsen uit de error string
            const errorJson = JSON.parse(error.message.substring(4));
            if (errorJson.message) {
              errorMessage = errorJson.message;
              
              // Specifieke gebruikersvriendelijke berichten voor bekende fouten
              if (errorJson.field === "students_email_unique") {
                errorMessage = "Dit e-mailadres is al in gebruik. Gebruik een ander e-mailadres.";
                errorDetail = "Er bestaat al een student met dit e-mailadres in het systeem.";
              } else if (errorJson.field === "students_student_id_unique") {
                errorMessage = "Dit studentnummer is al in gebruik.";
                errorDetail = "Er bestaat al een student met dit studentnummer in het systeem.";
              } else if (errorJson.detail) {
                errorDetail = errorJson.detail;
              }
            }
          } catch (jsonError) {
            // Als JSON parsen mislukt, toon dan de ruwe error
            errorMessage = "Duplicaat gevonden: Dit e-mailadres of studentnummer is al in gebruik.";
            errorDetail = error.message;
          }
        }
        // Validatiefouten (HTTP 400)
        else if (error.message && error.message.startsWith("400:")) {
          try {
            const errorJson = JSON.parse(error.message.substring(4));
            if (errorJson.errors) {
              errorMessage = "Er zijn validatiefouten in het formulier:";
              
              if (Array.isArray(errorJson.errors)) {
                // Zet de fouten om in een leesbare lijst
                errorDetail = errorJson.errors.map((err: any) => {
                  const field = err.path ? err.path[err.path.length - 1] : "";
                  const fieldName = 
                    field === "email" ? "E-mailadres" :
                    field === "firstName" ? "Voornaam" :
                    field === "lastName" ? "Achternaam" :
                    field === "studentId" ? "Studentnummer" :
                    field === "phone" ? "Telefoonnummer" :
                    field === "dateOfBirth" ? "Geboortedatum" :
                    field === "address" ? "Adres" : field;
                  return `• ${fieldName || 'Veld'}: ${err.message}`;
                }).join('\n');
              }
            } else if (errorJson.message) {
              errorMessage = errorJson.message;
            }
          } catch (jsonError) {
            errorMessage = "Validatiefout in het formulier";
            errorDetail = error.message;
          }
        }
        // Fallback voor andere fouten
        else if (error.message) {
          errorMessage = "Fout bij het toevoegen van de student";
          errorDetail = error.message;
        }
      } catch (parseError) {
        console.error("Fout bij parsen van API foutmelding:", parseError);
      }
      
      toast({
        title: "Fout bij toevoegen",
        description: (
          <div>
            <p>{errorMessage}</p>
            {errorDetail && <pre className="mt-2 p-2 bg-destructive/10 rounded text-sm">{errorDetail}</pre>}
          </div>
        ),
        variant: "destructive",
      });
    }
  });

  const handleAddStudent = async () => {
    // Maak een API aanroep om het volgende studentnummer te verkrijgen
    try {
      const response = await fetch('/api/next-student-id');
      const data = await response.json();
      
      // Open het toevoeg-dialoogvenster en zet het voorgestelde studentnummer
      setStudentFormData({
        ...studentFormData,
        studentId: data.nextStudentId || 'Wordt gegenereerd'
      });
    } catch (error) {
      console.error('Fout bij ophalen volgende studentnummer:', error);
      // Bij fout gebruiken we een standaard waarde
      setStudentFormData({
        ...studentFormData,
        studentId: 'Wordt gegenereerd'
      });
    }
    
    // Open het dialoogvenster
    setIsAddDialogOpen(true);
  };
  
  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Maak een diepe kopie om te voorkomen dat we de originele state aanpassen
      const formattedData = JSON.parse(JSON.stringify(studentFormData));
      
      // Verwerk alle datumvelden op dezelfde manier
      ['dateOfBirth', 'enrollmentDate'].forEach(field => {
        // Verwijder lege datumvelden
        if (!formattedData[field] || formattedData[field] === '') {
          delete formattedData[field];
        }
      });
      
      // Verwijder alle lege velden die niet verplicht zijn
      ['city', 'postalCode'].forEach(field => {
        if (!formattedData[field] || formattedData[field] === '') {
          delete formattedData[field];
        }
      });
      
      console.log('Verstuur student data na opschoning:', formattedData);
      
      // Verzend de geformatteerde data
      createStudentMutation.mutate(formattedData);
    } catch (error) {
      console.error('Fout bij het formatteren van studentgegevens:', error);
      toast({
        title: "Fout bij verwerken",
        description: "Er is een fout opgetreden bij het verwerken van het formulier.",
        variant: "destructive",
      });
    }
  };

  // Functie om voogden en siblings voor een student op te halen
  const fetchStudentFamily = async (studentId: number) => {
    try {
      // Reset de huidige staat
      setLinkedGuardians([]);
      setSiblings([]);
      
      // 1. Haal eerst alle voogden op die gekoppeld zijn aan deze student
      const guardianRelationsResponse = await apiRequest('GET', `/api/students/${studentId}/guardians`);
      const guardianRelations = Array.isArray(guardianRelationsResponse) ? guardianRelationsResponse : [];
      
      // Voor elke guardian relatie, haal de volledige guardian informatie op
      const enrichedGuardianPromises = guardianRelations.map(async (relation: any) => {
        if (relation && relation.guardianId) {
          try {
            const guardianResponse = await apiRequest('GET', `/api/guardians/${relation.guardianId}`);
            // Voeg guardian info toe aan de relatie
            return {
              ...relation,
              guardian: guardianResponse
            };
          } catch (err) {
            console.error(`Fout bij ophalen van guardian ${relation.guardianId}:`, err);
            return relation;
          }
        }
        return relation;
      });
      
      const enrichedGuardians = await Promise.all(enrichedGuardianPromises);
      setLinkedGuardians(enrichedGuardians);
      
      // 2. Voor elke voogd, haal alle gekoppelde studenten op (potentiële siblings)
      const allSiblingsSet = new Set<any>();
      
      // Voor elke voogd, zoek alle studenten die aan deze voogd zijn gekoppeld
      if (guardianRelations.length > 0) {
        for (const guardianLink of guardianRelations) {
          if (guardianLink && guardianLink.guardianId) {
            const guardianStudentsResponse = await apiRequest('GET', `/api/guardians/${guardianLink.guardianId}/students`);
            const guardianStudentRelations = Array.isArray(guardianStudentsResponse) ? guardianStudentsResponse : [];
            
            // Voeg studenten toe die niet de huidige student zijn
            for (const relation of guardianStudentRelations) {
              if (relation && relation.studentId && relation.studentId !== studentId) {
                try {
                  // Haal de volledige studentinformatie op
                  const siblingResponse = await apiRequest('GET', `/api/students/${relation.studentId}`);
                  if (siblingResponse) {
                    allSiblingsSet.add(siblingResponse);
                  }
                } catch (err) {
                  console.error(`Fout bij ophalen van sibling ${relation.studentId}:`, err);
                }
              }
            }
          }
        }
      }
      
      // Converteer Set naar Array
      const uniqueSiblings = Array.from(allSiblingsSet);
      setSiblings(uniqueSiblings);
      
    } catch (error) {
      console.error("Fout bij ophalen van familie-informatie:", error);
      setLinkedGuardians([]);
      setSiblings([]);
      
      toast({
        title: "Fout bij ophalen",
        description: "Er is een fout opgetreden bij het ophalen van familiegegevens.",
        variant: "destructive",
      });
    }
  };

  // Functie om beschikbare voogden op te halen die nog niet aan de student zijn gekoppeld
  const fetchAvailableGuardians = async (studentId: number) => {
    try {
      // Haal alle voogden op
      const allGuardiansResponse = await apiRequest('GET', '/api/guardians');
      const allGuardians = Array.isArray(allGuardiansResponse) ? allGuardiansResponse : [];
      
      // Haal voogden op die al gekoppeld zijn aan deze student
      const studentGuardiansResponse = await apiRequest('GET', `/api/students/${studentId}/guardians`);
      const studentGuardians = Array.isArray(studentGuardiansResponse) ? studentGuardiansResponse : [];
      
      // Maak een set van guardian IDs die al gekoppeld zijn
      const linkedGuardianIds = new Set(studentGuardians.map((relation: any) => relation.guardianId));
      
      // Filter alleen voogden die nog niet gekoppeld zijn
      const availableGuardiansList = allGuardians.filter((guardian: any) => !linkedGuardianIds.has(guardian.id));
      
      setAvailableGuardians(availableGuardiansList);
      // Reset geselecteerde waarden
      setSelectedGuardianId(null);
      setGuardianRelationType('parent');
      setIsEmergencyContact(false);
      
    } catch (error) {
      console.error("Fout bij ophalen van beschikbare voogden:", error);
      setAvailableGuardians([]);
      
      toast({
        title: "Fout bij ophalen",
        description: "Er is een fout opgetreden bij het ophalen van beschikbare voogden.",
        variant: "destructive",
      });
    }
  };
  
  // Functie om een voogd aan een student te koppelen
  const linkGuardianToStudent = async (studentId: number, guardianId: number) => {
    if (!guardianId) {
      toast({
        title: "Selectie vereist",
        description: "Selecteer een voogd om te koppelen.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await apiRequest('POST', '/api/student-guardians', {
        studentId,
        guardianId,
        relationshipType: guardianRelationType,
        isEmergencyContact
      });
      
      // Succes melding
      toast({
        title: "Voogd gekoppeld",
        description: "De voogd is succesvol gekoppeld aan de student.",
        variant: "default",
      });
      
      // Sluit dialoog en vernieuw familie gegevens
      setIsLinkGuardianDialogOpen(false);
      fetchStudentFamily(studentId);
      
    } catch (error) {
      console.error("Fout bij koppelen van voogd:", error);
      
      toast({
        title: "Fout bij koppelen",
        description: "Er is een fout opgetreden bij het koppelen van de voogd.",
        variant: "destructive",
      });
    }
  };
  
  const handleOpenLinkGuardianDialog = () => {
    if (selectedStudent) {
      fetchAvailableGuardians(selectedStudent.id);
      setIsLinkGuardianDialogOpen(true);
    }
  };
  
  // State voor nieuwe voogd aanmaken
  const [newGuardianData, setNewGuardianData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    relationshipType: 'parent',
    isEmergencyContact: false
  });
  
  // Functie om een nieuwe voogd aan te maken
  const createGuardian = async () => {
    // Validatie
    if (!newGuardianData.firstName || !newGuardianData.lastName) {
      toast({
        title: "Verplichte velden",
        description: "Vul ten minste de voor- en achternaam in.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Maak eerst de voogd aan
      const guardianResponse = await apiRequest('POST', '/api/guardians', {
        firstName: newGuardianData.firstName,
        lastName: newGuardianData.lastName,
        email: newGuardianData.email || undefined,
        phone: newGuardianData.phone || undefined,
        address: newGuardianData.address || undefined,
        city: newGuardianData.city || undefined,
        postalCode: newGuardianData.postalCode || undefined,
      });
      
      // Koppel de voogd aan de student als dat succesvol was
      if (guardianResponse && selectedStudent) {
        await apiRequest('POST', '/api/student-guardians', {
          studentId: selectedStudent.id,
          guardianId: guardianResponse.id,
          relationshipType: newGuardianData.relationshipType,
          isEmergencyContact: newGuardianData.isEmergencyContact
        });
        
        // Reset het formulier en sluit het dialoogvenster
        setNewGuardianData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          postalCode: '',
          relationshipType: 'parent',
          isEmergencyContact: false
        });
        
        setIsCreateGuardianDialogOpen(false);
        setIsLinkGuardianDialogOpen(false);
        
        // Vernieuw de gegevens
        fetchStudentFamily(selectedStudent.id);
        
        toast({
          title: "Voogd toegevoegd",
          description: "De nieuwe voogd is succesvol aangemaakt en gekoppeld.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Fout bij aanmaken van voogd:", error);
      
      toast({
        title: "Fout bij aanmaken",
        description: "Er is een fout opgetreden bij het aanmaken van de voogd.",
        variant: "destructive",
      });
    }
  };

  const handleViewStudent = (student: any) => {
    // Stel de geselecteerde student in en open het dialoogvenster
    setSelectedStudent(student);
    setIsDetailDialogOpen(true);
    
    // Haal familiegegevens op
    fetchStudentFamily(student.id);
  };

  const handleEditStudent = (student: any) => {
    // Stel de geselecteerde student in en kopieer hun gegevens naar het formulier
    setSelectedStudent(student);
    setStudentFormData({
      studentId: student.studentId || '',
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      phone: student.phone || '',
      dateOfBirth: student.dateOfBirth || '',
      address: student.address || '',
      street: student.street || '',
      houseNumber: student.houseNumber || '',
      postalCode: student.postalCode || '',
      city: student.city || '',
      programId: student.programId,
      yearLevel: student.yearLevel,
      enrollmentDate: student.enrollmentDate || '',
      status: student.status || 'active',
      notes: student.notes || '',
    });
    setIsEditDialogOpen(true);
  };

  // Mutatie voor het updaten van een student
  const updateStudentMutation = useMutation({
    mutationFn: async (data: { id: string; studentData: typeof studentFormData }) => {
      return apiRequest('PUT', `/api/students/${data.id}`, data.studentData);
    },
    onSuccess: () => {
      // Vernieuw de lijst van studenten
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      
      // Sluit het dialoog en reset het formulier
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      
      // Toon een succesmelding
      toast({
        title: "Student bijgewerkt",
        description: "De studentgegevens zijn succesvol bijgewerkt.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error("Student bijwerkfout:", error);
      
      // Probeer meer gedetailleerde foutinformatie te krijgen
      let errorMessage = "Er is een fout opgetreden bij het bijwerken van de student.";
      let errorDetail = "";
      
      try {
        if (error.response && error.response.data) {
          const responseData = error.response.data;
          
          // Controleer op duplicate key fouten (HTTP 409)
          if (error.response.status === 409) {
            errorMessage = responseData.message || "Dit studentnummer of e-mailadres is al in gebruik.";
            errorDetail = responseData.detail || "";
          }
          // Validatiefouten (HTTP 400)
          else if (error.response.status === 400 && responseData.errors) {
            errorMessage = "Er zijn validatiefouten in het formulier:";
            
            if (Array.isArray(responseData.errors)) {
              // Zet de fouten om in een leesbare lijst
              errorDetail = responseData.errors.map((err: any) => {
                const field = err.path ? err.path[err.path.length - 1] : "";
                return `• ${field || 'Veld'}: ${err.message}`;
              }).join('\n');
            }
          } 
          // Algemene serverfout maar met bericht
          else if (responseData.message) {
            errorMessage = responseData.message;
            errorDetail = responseData.detail || "";
          }
        } 
      } catch (parseError) {
        console.error("Fout bij parsen van API foutmelding:", parseError);
      }
      
      toast({
        title: "Fout bij bijwerken",
        description: (
          <div>
            <p>{errorMessage}</p>
            {errorDetail && <pre className="mt-2 p-2 bg-destructive/10 rounded text-sm">{errorDetail}</pre>}
          </div>
        ),
        variant: "destructive",
      });
    }
  });

  const handleSubmitEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudent) {
      try {
        // Maak een diepe kopie om te voorkomen dat we de originele state aanpassen
        const formattedData = JSON.parse(JSON.stringify(studentFormData));
        
        // Verwerk alle datumvelden op dezelfde manier
        ['dateOfBirth', 'enrollmentDate'].forEach(field => {
          // Verwijder lege datumvelden
          if (!formattedData[field] || formattedData[field] === '') {
            delete formattedData[field];
          }
        });
        
        // Verwijder alle lege velden die niet verplicht zijn
        ['city', 'postalCode'].forEach(field => {
          if (!formattedData[field] || formattedData[field] === '') {
            delete formattedData[field];
          }
        });
        
        console.log('Verstuur bewerkte student data na opschoning:', formattedData);
        
        updateStudentMutation.mutate({
          id: selectedStudent.id,
          studentData: formattedData
        });
      } catch (error) {
        console.error('Fout bij het formatteren van studentgegevens voor update:', error);
        toast({
          title: "Fout bij verwerken",
          description: "Er is een fout opgetreden bij het verwerken van het formulier.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteStudent = (student: any) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  // Mutatie voor het verwijderen van een student
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/students/${id}`);
    },
    onSuccess: () => {
      // Vernieuw de lijst van studenten
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      
      // Sluit het dialoog
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      
      // Toon een succesmelding
      toast({
        title: "Student verwijderd",
        description: "De student is succesvol verwijderd uit het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van de student.",
        variant: "destructive",
      });
    }
  });

  const confirmDeleteStudent = () => {
    if (selectedStudent) {
      deleteStudentMutation.mutate(selectedStudent.id);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleProgramChange = (value: string) => {
    // Waarde opslaan als string maar zorg ervoor dat cijfers correct worden verwerkt
    setProgram(value);
    setCurrentPage(1);
    // Invalidate queries om zeker te zijn van verse data
    queryClient.invalidateQueries({ queryKey: ['/api/students'] });
  };

  const handleStudentGroupChange = (value: string) => {
    setStudentGroup(value);
    setCurrentPage(1);
    // Invalidate queries om zeker te zijn van verse data
    queryClient.invalidateQueries({ queryKey: ['/api/students'] });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setCurrentPage(1);
    // Invalidate queries om zeker te zijn van verse data
    queryClient.invalidateQueries({ queryKey: ['/api/students'] });
  };

  const toggleNameSort = () => {
    setNameSort(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Dialog voor het bewerken van een student
  const EditStudentDialog = () => (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className="w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student bewerken</DialogTitle>
          <DialogDescription>
            Werk de gegevens van de student bij. Velden met een * zijn verplicht.
            Studentnummer kan niet gewijzigd worden.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmitEditStudent}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <Label htmlFor="editStudentId" className="text-right">
                  Studentnummer <span className="text-xs text-muted-foreground font-normal italic">(niet bewerkbaar)</span>
                </Label>
                <Input
                  id="editStudentId"
                  value={studentFormData.studentId}
                  className="mt-1 bg-muted cursor-not-allowed"
                  disabled
                  readOnly
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="editStatus" className="text-right">
                  Status
                </Label>
                <Select 
                  value={studentFormData.status} 
                  onValueChange={(value) => setStudentFormData({ ...studentFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Actief</SelectItem>
                    <SelectItem value="Inactive">Inactief</SelectItem>
                    <SelectItem value="Pending">In afwachting</SelectItem>
                    <SelectItem value="Graduated">Afgestudeerd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <Label htmlFor="editFirstName" className="text-right">
                  Voornaam*
                </Label>
                <Input
                  id="editFirstName"
                  required
                  value={studentFormData.firstName}
                  onChange={(e) => setStudentFormData({ ...studentFormData, firstName: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="editLastName" className="text-right">
                  Achternaam*
                </Label>
                <Input
                  id="editLastName"
                  required
                  value={studentFormData.lastName}
                  onChange={(e) => setStudentFormData({ ...studentFormData, lastName: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <Label htmlFor="editEmail" className="text-right">
                  E-mail*
                </Label>
                <Input
                  id="editEmail"
                  type="email"
                  required
                  value={studentFormData.email}
                  onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="editPhone" className="text-right">
                  Telefoon
                </Label>
                <Input
                  id="editPhone"
                  value={studentFormData.phone}
                  onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <Label htmlFor="editDateOfBirth" className="text-right">
                  Geboortedatum
                </Label>
                <Input
                  id="editDateOfBirth"
                  type="date"
                  value={studentFormData.dateOfBirth || ''}
                  onChange={(e) => setStudentFormData({ ...studentFormData, dateOfBirth: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="editStreet" className="text-right">
                  Straatnaam
                </Label>
                <Input
                  id="editStreet"
                  value={studentFormData.street}
                  onChange={(e) => setStudentFormData({ ...studentFormData, street: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <Label htmlFor="editHouseNumber" className="text-right">
                  Huisnummer
                </Label>
                <Input
                  id="editHouseNumber"
                  value={studentFormData.houseNumber}
                  onChange={(e) => setStudentFormData({ ...studentFormData, houseNumber: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="editPostalCode" className="text-right">
                  Postcode
                </Label>
                <Input
                  id="editPostalCode"
                  value={studentFormData.postalCode}
                  onChange={(e) => setStudentFormData({ ...studentFormData, postalCode: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="editCity" className="text-right">
                  Stad
                </Label>
                <Input
                  id="editCity"
                  value={studentFormData.city}
                  onChange={(e) => setStudentFormData({ ...studentFormData, city: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label htmlFor="editProgramId" className="text-right">
                  Vak
                </Label>
                <Select
                  value={studentFormData.programId?.toString() || ''}
                  onValueChange={handleProgramIdChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecteer vak" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geen programma</SelectItem>
                    {programs.map((program: {id: number, name: string}) => (
                      <SelectItem key={program.id} value={String(program.id)}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Label htmlFor="editYearLevel" className="text-right">
                  Studiejaar
                </Label>
                <Select
                  value={studentFormData.yearLevel?.toString() || ''}
                  onValueChange={handleYearLevelChange}
                  disabled={!studentFormData.programId}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={!studentFormData.programId ? "Selecteer eerst een programma" : "Selecteer jaar"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Geen jaar</SelectItem>
                    {getYearLevelOptions(studentFormData.programId).map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        Jaar {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              disabled={updateStudentMutation.isPending}
            >
              {updateStudentMutation.isPending ? 'Bezig met bijwerken...' : 'Student bijwerken'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
  
  // Dialog voor het verwijderen van een student
  const DeleteStudentDialog = () => (
    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Student verwijderen</DialogTitle>
          <DialogDescription>
            Weet je zeker dat je deze student wilt verwijderen? 
            Deze actie kan niet ongedaan worden gemaakt.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {selectedStudent && (
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {selectedStudent.firstName?.charAt(0)}{selectedStudent.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                <p className="text-sm text-gray-500">Studentnummer: {selectedStudent.studentId}</p>
                <p className="text-sm text-gray-500">{selectedStudent.email}</p>
              </div>
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
            onClick={confirmDeleteStudent}
            disabled={deleteStudentMutation.isPending}
          >
            {deleteStudentMutation.isPending ? 'Bezig met verwijderen...' : 'Student verwijderen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Studentenbeheer</h1>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Zoek studenten..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button onClick={handleAddStudent} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Student Toevoegen</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vak</label>
            <Select value={program} onValueChange={handleProgramChange}>
              <SelectTrigger>
                <SelectValue placeholder="Alle Vakken" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Vakken</SelectItem>
                {programs.map((program: {id: number, name: string}) => (
                  <SelectItem key={program.id} value={String(program.id)}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Klas</label>
            <Select value={studentGroup} onValueChange={handleStudentGroupChange}>
              <SelectTrigger>
                <SelectValue placeholder="Alle Klassen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Klassen</SelectItem>
                {studentGroups.map((group: {id: number, name: string}) => (
                  <SelectItem key={group.id} value={String(group.id)}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Alle Statussen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Statussen</SelectItem>
                <SelectItem value="active">Actief</SelectItem>
                <SelectItem value="pending">In afwachting</SelectItem>
                <SelectItem value="inactive">Inactief</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sorteren op</label>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Naam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Naam</SelectItem>
                <SelectItem value="id">ID</SelectItem>
                <SelectItem value="program">Programma</SelectItem>
                <SelectItem value="date">Registratiedatum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {isLoading ? 'Laden...' : `Tonen van ${students.length} van de ${totalStudents} studenten`}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Toon of verberg geavanceerde filteropties
                alert('Geavanceerde filteropties worden hier weergegeven');
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filteren
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Exporteer studentengegevens als CSV
                console.log('Exporteren van studentengegevens');
                alert('Studentengegevens worden geëxporteerd als CSV...');
                // Hier API-aanroep voor downloaden implementeren
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Exporteren
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                    />
                    Student
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programma</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jaar</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-red-500">
                    Fout bij het laden van studenten. Probeer het opnieuw.
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Geen studenten gevonden. Probeer je filters aan te passen.
                  </td>
                </tr>
              ) : (
                sortedStudents.map((student: any) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                        />
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.studentId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {programs.find((p: {id: number, name: string}) => p.id === student.programId)?.name || 'Onbekend'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Jaar {student.yearLevel || 'Onbekend'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.status.toLowerCase() === 'active' || student.status.toLowerCase() === 'actief' ? 'bg-green-100 text-green-800' : 
                        student.status.toLowerCase() === 'pending' || student.status.toLowerCase() === 'in afwachting' ? 'bg-yellow-100 text-yellow-800' : 
                        student.status.toLowerCase() === 'inactive' || student.status.toLowerCase() === 'inactief' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {student.status.toLowerCase() === 'active' ? 'Actief' : 
                         student.status.toLowerCase() === 'pending' ? 'In afwachting' : 
                         student.status.toLowerCase() === 'inactive' ? 'Inactief' :
                         student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary-dark"
                        onClick={() => handleViewStudent(student)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Bekijken</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => handleEditStudent(student)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Bewerken</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteStudent(student)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Verwijderen</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Tonen <span className="font-medium">{students.length > 0 ? (currentPage - 1) * 10 + 1 : 0}</span> tot <span className="font-medium">{Math.min(currentPage * 10, totalStudents)}</span> van <span className="font-medium">{totalStudents}</span> resultaten
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginering">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Vorige</span>
                  &larr;
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                      currentPage === i + 1
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Volgende</span>
                  &rarr;
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>



      {/* Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nieuwe Student Toevoegen</DialogTitle>
            <DialogDescription>
              Vul de studentinformatie in om een nieuwe student toe te voegen aan het systeem.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitStudent}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="studentId" className="text-right">
                    Studentnummer <span className="text-xs text-muted-foreground font-normal italic">(automatisch)</span>
                  </Label>
                  <Input
                    id="studentId"
                    value={studentFormData.studentId}
                    className="mt-1 bg-muted cursor-not-allowed"
                    disabled
                    readOnly
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select
                    value={studentFormData.status || ''}
                    onValueChange={(value) => setStudentFormData({ ...studentFormData, status: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Actief</SelectItem>
                      <SelectItem value="Inactive">Inactief</SelectItem>
                      <SelectItem value="Suspended">Geschorst</SelectItem>
                      <SelectItem value="Graduated">Afgestudeerd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="firstName" className="text-right">
                    Voornaam
                  </Label>
                  <Input
                    id="firstName"
                    required
                    value={studentFormData.firstName}
                    onChange={(e) => setStudentFormData({ ...studentFormData, firstName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="lastName" className="text-right">
                    Achternaam
                  </Label>
                  <Input
                    id="lastName"
                    required
                    value={studentFormData.lastName}
                    onChange={(e) => setStudentFormData({ ...studentFormData, lastName: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="email" className="text-right">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={studentFormData.email}
                    onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="phone" className="text-right">
                    Telefoonnummer
                  </Label>
                  <Input
                    id="phone"
                    value={studentFormData.phone || ''}
                    onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="dateOfBirth" className="text-right">
                    Geboortedatum
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={studentFormData.dateOfBirth || ''}
                    onChange={(e) => setStudentFormData({ ...studentFormData, dateOfBirth: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="street" className="text-right">
                    Straatnaam
                  </Label>
                  <Input
                    id="street"
                    value={studentFormData.street || ''}
                    onChange={(e) => setStudentFormData({ ...studentFormData, street: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="houseNumber" className="text-right">
                    Huisnummer
                  </Label>
                  <Input
                    id="houseNumber"
                    value={studentFormData.houseNumber || ''}
                    onChange={(e) => setStudentFormData({ ...studentFormData, houseNumber: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="postalCode" className="text-right">
                    Postcode
                  </Label>
                  <Input
                    id="postalCode"
                    value={studentFormData.postalCode || ''}
                    onChange={(e) => setStudentFormData({ ...studentFormData, postalCode: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="city" className="text-right">
                    Stad
                  </Label>
                  <Input
                    id="city"
                    value={studentFormData.city || ''}
                    onChange={(e) => setStudentFormData({ ...studentFormData, city: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Label htmlFor="notes" className="text-right">
                  Notities
                </Label>
                <Textarea
                  id="notes"
                  value={studentFormData.notes || ''}
                  onChange={(e) => setStudentFormData({ ...studentFormData, notes: e.target.value })}
                  className="mt-1 min-h-[120px]"
                  placeholder="Voeg hier eventuele notities over de student toe..."
                />
              </div>
              
              <div className="space-y-4 mt-4">
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold mb-2">Vakken</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecteer één of meerdere vakken voor deze student
                  </p>
                  
                  {/* Lijst met toegevoegde programma's */}
                  {selectedPrograms.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {selectedPrograms.map((program, index) => {
                        const programInfo = programs.find((p: any) => p.id === program.programId);
                        return (
                          <div key={index} className="flex items-center justify-between border rounded-md p-3 bg-muted/20">
                            <div>
                              <div className="font-medium">{programInfo?.name}</div>
                              <div className="text-sm text-muted-foreground">Jaar: {program.yearLevel || 'Niet gespecificeerd'}</div>
                              <Badge variant={program.status === 'active' ? 'success' : 'outline'}>
                                {program.status === 'active' ? 'Actief' : program.status === 'inactive' ? 'Inactief' : program.status}
                              </Badge>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setSelectedPrograms(selectedPrograms.filter((_, i) => i !== index));
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Nieuwe programma toevoegen interface */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md">
                    <div>
                      <Label htmlFor="newProgramId">Vak</Label>
                      <Select
                        value={studentFormData.programId?.toString() || ''}
                        onValueChange={handleProgramIdChange}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecteer programma" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map((program: {id: number, name: string}) => (
                            <SelectItem key={program.id} value={String(program.id)}>
                              {program.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="newYearLevel">Studiejaar</Label>
                      <Select
                        value={studentFormData.yearLevel?.toString() || ''}
                        onValueChange={handleYearLevelChange}
                        disabled={!studentFormData.programId}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder={!studentFormData.programId ? "Selecteer eerst programma" : "Selecteer jaar"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Geen jaar</SelectItem>
                          {getYearLevelOptions(studentFormData.programId).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              Jaar {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-end">
                      <Button 
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={!studentFormData.programId}
                        onClick={() => {
                          if (studentFormData.programId) {
                            // Controleer of dit vak al is toegevoegd
                            const alreadyExists = selectedPrograms.some(
                              p => p.programId === studentFormData.programId
                            );
                            
                            if (!alreadyExists) {
                              setSelectedPrograms([
                                ...selectedPrograms,
                                {
                                  programId: studentFormData.programId,
                                  yearLevel: studentFormData.yearLevel,
                                  status: 'active'
                                }
                              ]);
                              
                              // Reset de programId en yearLevel voor de volgende toevoeging
                              setStudentFormData({
                                ...studentFormData,
                                programId: null,
                                yearLevel: null
                              });
                            } else {
                              // Toon een waarschuwing dat het vak al is toegevoegd
                              toast({
                                title: "Vak al toegevoegd",
                                description: "Deze student is al ingeschreven voor dit vak.",
                                variant: "destructive"
                              });
                            }
                          }
                        }}
                      >
                        Vak toevoegen
                      </Button>
                    </div>
                  </div>
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
                disabled={createStudentMutation.isPending}
              >
                {createStudentMutation.isPending ? 'Bezig met toevoegen...' : 'Student toevoegen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Render de Edit en Delete dialogen */}
      <EditStudentDialog />
      <DeleteStudentDialog />
      
      {/* Student Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Studentgegevens</DialogTitle>
            <DialogDescription>
              Gedetailleerde informatie over de student en programma-inschrijvingen.
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <Tabs defaultValue="general" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">Algemene Informatie</TabsTrigger>
                <TabsTrigger value="family">Familie</TabsTrigger>
                <TabsTrigger value="programs">Vakken</TabsTrigger>
                <TabsTrigger value="payments">Betaalgegevens</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="pt-4">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Linker kolom: student profiel */}
                  <div className="w-full md:w-1/4 border rounded-lg p-6 bg-card">
                    <div className="flex flex-col items-center mb-6">
                      <Avatar className="h-24 w-24 mb-4">
                        <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                          {selectedStudent.firstName?.charAt(0)}{selectedStudent.lastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <h2 className="text-2xl font-bold text-center">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                      <p className="text-muted-foreground text-center">{selectedStudent.studentId}</p>
                      <Badge variant={
                        selectedStudent.status === 'active' ? 'success' :
                        selectedStudent.status === 'inactive' ? 'secondary' :
                        selectedStudent.status === 'pending' ? 'warning' : 'default'
                      } className="mt-2 px-3 py-1">
                        {selectedStudent.status.charAt(0).toUpperCase() + selectedStudent.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                        <p className="font-medium">{selectedStudent.email || "Niet ingevuld"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Telefoonnummer</h3>
                        <p className="font-medium">{selectedStudent.phone || "Niet ingevuld"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Geboortedatum</h3>
                        <p className="font-medium">{selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString('nl-NL') : "Niet ingevuld"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Inschrijvingsdatum</h3>
                        <p className="font-medium">{selectedStudent.enrollmentDate ? new Date(selectedStudent.enrollmentDate).toLocaleDateString('nl-NL') : "Niet ingevuld"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rechter kolom: adres en extra informatie */}
                  <div className="w-full md:w-3/4 space-y-6">
                    <div className="border rounded-lg p-6 bg-card">
                      <h3 className="text-lg font-bold mb-4">Adresgegevens</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Straat</h3>
                          <p className="font-medium">{selectedStudent.street || "Niet ingevuld"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Huisnummer</h3>
                          <p className="font-medium">{selectedStudent.houseNumber || "Niet ingevuld"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Postcode</h3>
                          <p className="font-medium">{selectedStudent.postalCode || "Niet ingevuld"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Stad</h3>
                          <p className="font-medium">{selectedStudent.city || "Niet ingevuld"}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg p-6 bg-card">
                      <h3 className="text-lg font-bold mb-4">Aanvullende informatie</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Ingeschreven sinds</h3>
                          <p className="font-medium">{selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString('nl-NL') : "Onbekend"}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Laatst bijgewerkt</h3>
                          <p className="font-medium">{selectedStudent.updatedAt ? new Date(selectedStudent.updatedAt).toLocaleDateString('nl-NL') : "Onbekend"}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Notities</h3>
                        <div className="p-3 bg-muted rounded-md min-h-[100px]">
                          {selectedStudent.notes ? (
                            <p className="whitespace-pre-wrap">{selectedStudent.notes}</p>
                          ) : (
                            <p className="text-muted-foreground italic">Geen notities beschikbaar</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-4 mt-4">
                        <Button variant="outline" onClick={() => handleEditStudent(selectedStudent)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Bewerken
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="family" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ouders/Voogden sectie */}
                  <div className="border rounded-lg p-6 bg-card">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">Ouders / Voogden</h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8"
                        onClick={handleOpenLinkGuardianDialog}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Voogd koppelen
                      </Button>
                    </div>
                    <div className="space-y-4" id="guardians-list">
                      {linkedGuardians && linkedGuardians.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {linkedGuardians.map((guardianLink: any) => (
                            <div key={guardianLink.id} className="py-3 flex justify-between items-center">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10 mr-3">
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {guardianLink.guardian?.firstName?.[0]}{guardianLink.guardian?.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{guardianLink.guardian?.firstName} {guardianLink.guardian?.lastName}</p>
                                  <p className="text-sm text-muted-foreground">{guardianLink.relationshipType || 'Ouder'}</p>
                                </div>
                              </div>
                              <div>
                                {guardianLink.isEmergencyContact && (
                                  <Badge variant="destructive" className="mr-2">Noodcontact</Badge>
                                )}
                                <Button variant="ghost" size="sm" className="h-8">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <UserCircle className="mx-auto h-12 w-12 opacity-50" />
                          <p className="mt-2">Geen ouders of voogden gekoppeld.</p>
                          <p className="text-sm">Koppel voogden om familierelaties te beheren.</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Broers/Zussen sectie */}
                  <div className="border rounded-lg p-6 bg-card">
                    <h3 className="text-lg font-bold mb-4">Broers / Zussen</h3>
                    <div className="space-y-4" id="siblings-list">
                      {siblings && siblings.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                          {siblings.map((sibling: any) => (
                            <div key={sibling.id} className="py-3 flex justify-between items-center">
                              <div className="flex items-center">
                                <Avatar className="h-10 w-10 mr-3">
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {sibling.firstName?.[0]}{sibling.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{sibling.firstName} {sibling.lastName}</p>
                                  <p className="text-sm text-muted-foreground">#{sibling.studentId}</p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8"
                                onClick={() => handleViewStudent(sibling)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <UserCircle className="mx-auto h-12 w-12 opacity-50" />
                          <p className="mt-2">Geen broers of zussen gevonden.</p>
                          <p className="text-sm">Broers en zussen worden automatisch gelinkt op basis van gemeenschappelijke ouders/voogden.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="programs" className="pt-4">
                <StudentPrograms studentId={selectedStudent.id} />
              </TabsContent>
              
              <TabsContent value="payments" className="pt-4">
                <div className="bg-card border rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">Betaalgegevens</h3>
                  <div className="space-y-6">
                    {/* Betaalgegevens formulier */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="paymentMethod" className="text-sm font-medium">
                          Betaalwijze
                        </Label>
                        <Select defaultValue="bancontact">
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecteer betaalwijze" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bancontact">Bancontact</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="transfer">Overschrijving</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="paymentDueDate" className="text-sm font-medium">
                          Betaaltermijn
                        </Label>
                        <Input
                          id="paymentDueDate"
                          type="date"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="paymentNotes" className="text-sm font-medium">
                        Betalingsnotities
                      </Label>
                      <Textarea
                        id="paymentNotes"
                        className="mt-1 min-h-[120px]"
                        placeholder="Notities over betalingen..."
                      />
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <Button>
                        Betaalgegevens opslaan
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialoogvenster voor het koppelen van een voogd */}
      <Dialog open={isLinkGuardianDialogOpen} onOpenChange={setIsLinkGuardianDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Voogd koppelen</DialogTitle>
            <DialogDescription>
              Selecteer een bestaande voogd om te koppelen aan {selectedStudent?.firstName} {selectedStudent?.lastName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="guardian">Selecteer een voogd</Label>
              <Select value={selectedGuardianId?.toString() || ''} onValueChange={(value) => setSelectedGuardianId(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een voogd" />
                </SelectTrigger>
                <SelectContent>
                  {availableGuardians.length > 0 ? (
                    availableGuardians.map((guardian) => (
                      <SelectItem key={guardian.id} value={guardian.id.toString()}>
                        {guardian.firstName} {guardian.lastName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>Geen beschikbare voogden</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="relationType">Relatie type</Label>
              <Select value={guardianRelationType} onValueChange={setGuardianRelationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parent">Ouder</SelectItem>
                  <SelectItem value="guardian">Voogd</SelectItem>
                  <SelectItem value="grandparent">Grootouder</SelectItem>
                  <SelectItem value="other">Anders</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isEmergencyContact"
                checked={isEmergencyContact}
                onChange={(e) => setIsEmergencyContact(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isEmergencyContact" className="font-normal">
                Noodcontact
              </Label>
            </div>

            <div className="flex justify-between pt-3">
              <Button variant="outline" onClick={() => setIsCreateGuardianDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nieuwe voogd aanmaken
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkGuardianDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={() => selectedStudent && selectedGuardianId && linkGuardianToStudent(selectedStudent.id, selectedGuardianId)}>
              Koppelen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialoogvenster voor het aanmaken van een nieuwe voogd */}
      <Dialog open={isCreateGuardianDialogOpen} onOpenChange={setIsCreateGuardianDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nieuwe voogd aanmaken</DialogTitle>
            <DialogDescription>
              Maak een nieuwe voogd aan om te koppelen aan {selectedStudent?.firstName} {selectedStudent?.lastName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="font-medium">Voornaam*</Label>
                <Input
                  id="firstName"
                  value={newGuardianData.firstName}
                  onChange={(e) => setNewGuardianData({ ...newGuardianData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="font-medium">Achternaam*</Label>
                <Input
                  id="lastName"
                  value={newGuardianData.lastName}
                  onChange={(e) => setNewGuardianData({ ...newGuardianData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={newGuardianData.email}
                  onChange={(e) => setNewGuardianData({ ...newGuardianData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="font-medium">Telefoonnummer</Label>
                <Input
                  id="phone"
                  value={newGuardianData.phone}
                  onChange={(e) => setNewGuardianData({ ...newGuardianData, phone: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address" className="font-medium">Adres</Label>
              <Input
                id="address"
                value={newGuardianData.address}
                onChange={(e) => setNewGuardianData({ ...newGuardianData, address: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="font-medium">Plaats</Label>
                <Input
                  id="city"
                  value={newGuardianData.city}
                  onChange={(e) => setNewGuardianData({ ...newGuardianData, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode" className="font-medium">Postcode</Label>
                <Input
                  id="postalCode"
                  value={newGuardianData.postalCode}
                  onChange={(e) => setNewGuardianData({ ...newGuardianData, postalCode: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="relationshipType" className="font-medium">Relatie tot student</Label>
                <Select 
                  value={newGuardianData.relationshipType}
                  onValueChange={(value) => setNewGuardianData({ ...newGuardianData, relationshipType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Ouder</SelectItem>
                    <SelectItem value="guardian">Voogd</SelectItem>
                    <SelectItem value="grandparent">Grootouder</SelectItem>
                    <SelectItem value="other">Anders</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="newIsEmergencyContact"
                checked={newGuardianData.isEmergencyContact}
                onChange={(e) => setNewGuardianData({ ...newGuardianData, isEmergencyContact: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="newIsEmergencyContact" className="font-normal">
                Dit is een noodcontact
              </Label>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsCreateGuardianDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={createGuardian}>
              Voogd aanmaken en koppelen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
