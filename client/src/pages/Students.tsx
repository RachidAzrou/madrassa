import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, X, UserCircle,
  ChevronUp, ChevronDown, FileText, FileDown, Mail, Home, BookOpen, Phone,
  Users
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatDateToDatabaseFormat, formatDateToDisplayFormat } from '@/lib/utils';
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
  const [gender, setGender] = useState('all');
  const [minAge, setMinAge] = useState<string | undefined>(undefined);
  const [maxAge, setMaxAge] = useState<string | undefined>(undefined);
  
  // Sorteerstaten
  const [nameSort, setNameSort] = useState('asc');
  const [idSort, setIdSort] = useState('asc');
  const [classSort, setClassSort] = useState('asc');
  const [ageSort, setAgeSort] = useState('asc');
  const [genderSort, setGenderSort] = useState('asc');
  const [currentSort, setCurrentSort] = useState('name'); // name, id, class, age, gender
  
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
    studentGroupId: null as number | null,
    enrollmentDate: '',
    status: 'active' as string,
    notes: '',
    gender: '' as string,
  });
  
  // State voor meerdere programma's
  const [selectedPrograms, setSelectedPrograms] = useState<{
    programId: number;
    yearLevel: number | null;
    studentGroupId?: number | null;
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
    queryKey: ['/api/students', { searchTerm, program, studentGroup, status, gender, nameSort, page: currentPage }],
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

  // Filter studenten op basis van geslacht, leeftijd, klas en status
  const filteredStudents = [...students].filter(student => {
    // Filter op geslacht
    if (gender !== 'all' && student.gender !== gender) {
      return false;
    }
    
    // Filter op leeftijd (minAge)
    if (minAge && !isNaN(parseInt(minAge))) {
      const studentAge = calculateAge(student.dateOfBirth);
      if (!studentAge || studentAge < parseInt(minAge)) {
        return false;
      }
    }
    
    // Filter op leeftijd (maxAge)
    if (maxAge && !isNaN(parseInt(maxAge))) {
      const studentAge = calculateAge(student.dateOfBirth);
      if (!studentAge || studentAge > parseInt(maxAge)) {
        return false;
      }
    }
    
    // Filter op studentengroep (klas)
    if (studentGroup !== 'all') {
      // We gebruiken hier een helper-functie die de studentengroep-IDs voor een student ophaalt
      // In de toekomst dit vervangen door een echte query of relatie
      // Voor nu gebruiken we een vereenvoudigde check
      // Echte implementatie zou studentGroupEnrollments.studentId checken
      return false; // Tijdelijk uitgeschakeld tot we StudentGroupEnrollments hebben
    }
    
    // Filter op status
    if (status !== 'all' && student.status.toLowerCase() !== status.toLowerCase()) {
      return false;
    }
    
    return true;
  });

  // Sorteer studenten op basis van de huidige sorteeroptie en richting
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (currentSort === 'name') {
      // Sorteren op naam
      const nameCompare = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      return nameSort === 'asc' ? nameCompare : -nameCompare;
    } 
    else if (currentSort === 'id') {
      // Sorteren op studentnummer
      const idA = a.studentId || '';
      const idB = b.studentId || '';
      const idCompare = idA.localeCompare(idB, undefined, {numeric: true});
      return idSort === 'asc' ? idCompare : -idCompare;
    }
    else if (currentSort === 'class') {
      // Sorteren op klas
      const classA = getStudentGroupName(a.id) || '';
      const classB = getStudentGroupName(b.id) || '';
      const classCompare = classA.localeCompare(classB);
      return classSort === 'asc' ? classCompare : -classCompare;
    }
    else if (currentSort === 'age') {
      // Sorteren op leeftijd
      const ageA = calculateAge(a.dateOfBirth) || 0;
      const ageB = calculateAge(b.dateOfBirth) || 0;
      const ageCompare = ageA - ageB;
      return ageSort === 'asc' ? ageCompare : -ageCompare;
    }
    else if (currentSort === 'gender') {
      // Sorteren op geslacht
      const genderA = a.gender || '';
      const genderB = b.gender || '';
      const genderCompare = genderA.localeCompare(genderB);
      return genderSort === 'asc' ? genderCompare : -genderCompare;
    }
    
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
        status: 'active',
        notes: '',
        gender: '',
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
        // Zorg ervoor dat de datum in het juiste formaat voor de database staat
        else if (typeof formattedData[field] === 'string') {
          formattedData[field] = formatDateToDatabaseFormat(formattedData[field]);
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
      gender: student.gender || '',
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
          // Zorg ervoor dat de datum in het juiste formaat voor de database staat
          else if (typeof formattedData[field] === 'string') {
            formattedData[field] = formatDateToDatabaseFormat(formattedData[field]);
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
  
  const handleGenderChange = (value: string) => {
    setGender(value);
    setCurrentPage(1);
    // Invalidate queries om zeker te zijn van verse data
    queryClient.invalidateQueries({ queryKey: ['/api/students'] });
  };

  // Sorteerfuncties
  const toggleNameSort = () => {
    setNameSort(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentSort('name');
  };
  
  const toggleIdSort = () => {
    setIdSort(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentSort('id');
  };
  
  const toggleClassSort = () => {
    setClassSort(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentSort('class');
  };
  
  const toggleAgeSort = () => {
    setAgeSort(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentSort('age');
  };
  
  const toggleGenderSort = () => {
    setGenderSort(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentSort('gender');
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
              <div className="col-span-1">
                <Label htmlFor="editEnrollmentDate" className="text-right">
                  Inschrijvingsdatum
                </Label>
                <Input
                  id="editEnrollmentDate"
                  placeholder="DD/MM/JJJJ"
                  value={studentFormData.enrollmentDate ? formatDateToDisplayFormat(studentFormData.enrollmentDate) : ''}
                  onChange={(e) => {
                    const formattedDate = formatDateToDatabaseFormat(e.target.value);
                    setStudentFormData({ ...studentFormData, enrollmentDate: formattedDate || '' });
                  }}
                  className="mt-1"
                />
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
              <div className="col-span-1">
                <Label htmlFor="editGender" className="text-right mb-2 block">
                  Geslacht
                </Label>
                <div className="space-y-2 mt-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="edit-gender-man"
                      checked={studentFormData.gender === 'man'}
                      onChange={() => setStudentFormData({ ...studentFormData, gender: 'man' })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="edit-gender-man" className="font-normal">Man</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="edit-gender-vrouw"
                      checked={studentFormData.gender === 'vrouw'}
                      onChange={() => setStudentFormData({ ...studentFormData, gender: 'vrouw' })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="edit-gender-vrouw" className="font-normal">Vrouw</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <Label htmlFor="editDateOfBirth" className="text-right">
                  Geboortedatum
                </Label>
                <Input
                  id="editDateOfBirth"
                  placeholder="DD/MM/JJJJ"
                  value={studentFormData.dateOfBirth ? formatDateToDisplayFormat(studentFormData.dateOfBirth) : ''}
                  onChange={(e) => {
                    const formattedDate = formatDateToDatabaseFormat(e.target.value);
                    setStudentFormData({ ...studentFormData, dateOfBirth: formattedDate || '' });
                  }}
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Studentenbeheer</h1>
          <p className="text-sm text-gray-500 mt-1">Beheer en monitor alle studenten in het systeem</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <Button onClick={handleAddStudent} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Student Toevoegen</span>
          </Button>
        </div>
      </div>
      
      {/* Statistiek widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-4">
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <UserCircle className="h-20 w-20 text-sky-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Totaal studenten</h3>
          <p className="text-2xl font-bold text-sky-700">{totalStudents}</p>
          <div className="flex justify-between mt-2 text-xs text-sky-600">
            <span>{students.filter(s => s.gender === 'man').length} mannen</span>
            <span>{students.filter(s => s.gender === 'vrouw').length} vrouwen</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Vakken & Klassen</h3>
              <p className="text-2xl font-bold text-sky-700">
                {programs.length + studentGroups.length}
              </p>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-sky-600">
            <span>{programs.length} vakken</span>
            <span>{studentGroups.length} klassen</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Status studenten</h3>
          <div className="flex justify-between mt-1">
            <div>
              <p className="text-lg font-semibold text-sky-700">
                <span className="text-2xl font-bold">{students.filter(s => s.status.toLowerCase() === 'active' || s.status.toLowerCase() === 'actief').length}</span>{' '}
                <span className="text-sm">actief</span>
              </p>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-sky-600">
            <span>{students.filter(s => s.status.toLowerCase() === 'pending' || s.status.toLowerCase() === 'in afwachting').length} in afwachting</span>
            <span>{students.filter(s => s.status.toLowerCase() === 'inactive' || s.status.toLowerCase() === 'inactief').length} inactief</span>
          </div>
        </div>
      </div>



      {/* Student List Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-end items-center">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="border-primary/30 text-primary hover:text-primary hover:bg-primary/5 hover:border-primary/50"
              onClick={() => {
                // Toon of verberg geavanceerde filteropties
                const advancedFilters = document.getElementById('advancedFilters');
                if (advancedFilters) {
                  advancedFilters.classList.toggle('hidden');
                }
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filteren
            </Button>
            
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="border-primary/30 text-primary hover:text-primary hover:bg-primary/5 hover:border-primary/50"
                onClick={() => {
                  // Export studenten als CSV bestand 
                  const headers = ['Studentnummer', 'Voornaam', 'Achternaam', 'Email', 'Telefoon', 'Vak', 'Klas', 'Geslacht', 'Status'];
                  const csvContent = [
                    headers.join(','),
                    ...sortedStudents.map(student => [
                      student.studentId,
                      student.firstName,
                      student.lastName,
                      student.email,
                      student.phone || '',
                      programs.find((p: any) => p.id === student.programId)?.name || 'Onbekend',
                      getStudentGroupName(student.id) || 'Geen klas',
                      student.gender === 'man' ? 'Man' : student.gender === 'vrouw' ? 'Vrouw' : 'Onbekend',
                      student.status
                    ].join(','))
                  ].join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `studenten_export_${new Date().toISOString().split('T')[0]}.csv`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  toast({
                    title: "CSV Export geslaagd",
                    description: "De studentenlijst is succesvol geëxporteerd als CSV-bestand.",
                    variant: "default",
                  });
                }}
              >
                <FileDown className="mr-2 h-4 w-4" />
                CSV
              </Button>
              

            </div>
          </div>
        </div>
        
        {/* Geavanceerde filter opties - standaard verborgen */}
        <div id="advancedFilters" className="p-6 border-b border-gray-200 bg-white hidden rounded-b-lg shadow-inner">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Geavanceerde filters</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Geslacht</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="filter-gender-all"
                    checked={gender === 'all'}
                    onChange={() => handleGenderChange('all')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="filter-gender-all" className="font-normal">Alle</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="filter-gender-man"
                    checked={gender === 'man'}
                    onChange={() => handleGenderChange('man')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="filter-gender-man" className="font-normal">Man</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="filter-gender-vrouw"
                    checked={gender === 'vrouw'}
                    onChange={() => handleGenderChange('vrouw')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="filter-gender-vrouw" className="font-normal">Vrouw</Label>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Leeftijd</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-600">Van</label>
                  <Input 
                    type="number" 
                    placeholder="Min" 
                    className="w-full bg-white" 
                    min={0}
                    max={100}
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-600">Tot</label>
                  <Input 
                    type="number" 
                    placeholder="Max" 
                    className="w-full bg-white" 
                    min={0}
                    max={100}
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Klas</label>
              <Select value={studentGroup} onValueChange={handleStudentGroupChange}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Alle klassen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle klassen</SelectItem>
                  {studentGroups.map((group: any) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="space-y-1">
                {['all', 'active', 'pending', 'inactive', 'graduated'].map((statusOption) => (
                  <div key={statusOption} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`filter-status-${statusOption}`}
                      checked={status === statusOption}
                      onChange={() => handleStatusChange(statusOption)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor={`filter-status-${statusOption}`} className="font-normal">
                      {statusOption === 'all' ? 'Alle' : 
                       statusOption === 'active' ? 'Actief' : 
                       statusOption === 'pending' ? 'In afwachting' : 
                       statusOption === 'inactive' ? 'Inactief' :
                       'Afgestudeerd'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button variant="outline" className="px-6" onClick={() => {
              // Reset alle filters
              setGender('all');
              setMinAge(undefined);
              setMaxAge(undefined);
              setStudentGroup('all');
              setStatus('all');
              setCurrentPage(1);
              
              // Invalidate queries om zeker te zijn van verse data
              queryClient.invalidateQueries({ queryKey: ['/api/students'] });
              
              // Notification
              toast({
                title: "Filters gewist",
                description: "Alle filter-instellingen zijn gereset.",
                variant: "default",
              });
            }}>
              Filters wissen
            </Button>
            <Button className="px-6" onClick={() => {
              // Pas filters toe - de state is al bijgewerkt door de onValueChange handlers
              setCurrentPage(1);
              
              // Invalidate queries om zeker te zijn van verse data
              queryClient.invalidateQueries({ queryKey: ['/api/students'] });
              
              // Sluit het filter panel
              const advancedFilters = document.getElementById('advancedFilters');
              if (advancedFilters) {
                advancedFilters.classList.add('hidden');
              }
              
              // Notification
              toast({
                title: "Filters toegepast",
                description: "De lijst is gefilterd volgens je selectie.",
                variant: "default",
              });
            }}>
              Filters toepassen
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center cursor-pointer" onClick={toggleNameSort}>
                    Student
                    {nameSort === 'asc' ? 
                      <ChevronUp className="ml-1 h-4 w-4" /> : 
                      <ChevronDown className="ml-1 h-4 w-4" />
                    }
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={toggleIdSort}>
                  <div className="flex items-center">
                    ID
                    {idSort === 'asc' ? 
                      <ChevronUp className="ml-1 h-4 w-4" /> : 
                      <ChevronDown className="ml-1 h-4 w-4" />
                    }
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={toggleClassSort}>
                  <div className="flex items-center">
                    Klas
                    {classSort === 'asc' ? 
                      <ChevronUp className="ml-1 h-4 w-4" /> : 
                      <ChevronDown className="ml-1 h-4 w-4" />
                    }
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={toggleAgeSort}>
                  <div className="flex items-center">
                    Leeftijd
                    {ageSort === 'asc' ? 
                      <ChevronUp className="ml-1 h-4 w-4" /> : 
                      <ChevronDown className="ml-1 h-4 w-4" />
                    }
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={toggleGenderSort}>
                  <div className="flex items-center">
                    Geslacht
                    {genderSort === 'asc' ? 
                      <ChevronUp className="ml-1 h-4 w-4" /> : 
                      <ChevronDown className="ml-1 h-4 w-4" />
                    }
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-red-500">
                    Fout bij het laden van studenten. Probeer het opnieuw.
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Geen studenten gevonden. Probeer je filters aan te passen.
                  </td>
                </tr>
              ) : (
                sortedStudents.map((student: any) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.studentId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getStudentGroupName(student.id) || 'Onbekend'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {calculateAge(student.dateOfBirth) ? `${calculateAge(student.dateOfBirth)} jaar` : 'Onbekend'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.gender === 'man' ? 'Man' : student.gender === 'vrouw' ? 'Vrouw' : 'Onbekend'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.status.toLowerCase() === 'active' || student.status.toLowerCase() === 'actief' ? 'bg-green-100 text-green-800' : 
                        student.status.toLowerCase() === 'pending' || student.status.toLowerCase() === 'in afwachting' ? 'bg-yellow-100 text-yellow-800' : 
                        student.status.toLowerCase() === 'inactive' || student.status.toLowerCase() === 'inactief' ? 'bg-red-100 text-red-800' :
                        student.status.toLowerCase() === 'graduated' || student.status.toLowerCase() === 'afgestudeerd' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {student.status.toLowerCase() === 'active' ? 'Actief' : 
                         student.status.toLowerCase() === 'pending' ? 'In afwachting' : 
                         student.status.toLowerCase() === 'inactive' ? 'Inactief' :
                         student.status.toLowerCase() === 'graduated' ? 'Afgestudeerd' :
                         student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center space-x-2">
                        <Button 
                          variant="action" 
                          size="sm" 
                          onClick={() => handleViewStudent(student)}
                          title="Details bekijken"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Bekijken</span>
                        </Button>
                        <Button 
                          variant="action" 
                          size="sm" 
                          onClick={() => handleEditStudent(student)}
                          title="Student bewerken"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Bewerken</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteStudent(student)}
                          title="Student verwijderen"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Verwijderen</span>
                        </Button>
                      </div>
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
        <DialogContent className="w-[95vw] max-h-[85vh] overflow-y-auto bg-gradient-to-b from-white to-blue-50/40">
          <DialogHeader className="border-b pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <UserCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-primary text-xl font-bold">Nieuwe Student Toevoegen</DialogTitle>
                <DialogDescription className="text-gray-500">
                  Vul de studentinformatie in om een nieuwe student toe te voegen aan het systeem.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmitStudent}>
            <div className="grid gap-6 py-2">
              {/* Tabs voor verschillende secties */}
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid grid-cols-5 mb-6">
                  <TabsTrigger value="personal" className="flex gap-2 items-center">
                    <UserCircle className="h-4 w-4" />
                    Persoonlijk
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="flex gap-2 items-center">
                    <Mail className="h-4 w-4" />
                    Contact
                  </TabsTrigger>
                  <TabsTrigger value="address" className="flex gap-2 items-center">
                    <Home className="h-4 w-4" />
                    Adres
                  </TabsTrigger>
                  <TabsTrigger value="class" className="flex gap-2 items-center">
                    <Users className="h-4 w-4" />
                    Klas
                  </TabsTrigger>
                  <TabsTrigger value="courses" className="flex gap-2 items-center">
                    <BookOpen className="h-4 w-4" />
                    Vakken
                  </TabsTrigger>
                </TabsList>

                {/* Persoonlijke informatie tab */}
                <TabsContent value="personal" className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/2 space-y-5">
                      <div className="flex items-center gap-4">
                        <div className="w-1/3">
                          <Label htmlFor="studentId" className="text-sm font-medium text-gray-700">
                            Studentnummer
                          </Label>
                          <div className="mt-1 relative">
                            <Input
                              id="studentId"
                              value={studentFormData.studentId}
                              className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed font-medium"
                              disabled
                              readOnly
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 italic">
                              (automatisch)
                            </div>
                          </div>
                        </div>
                        <div className="w-2/3">
                          <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                            Status <span className="text-primary">*</span>
                          </Label>
                          <Select
                            value={studentFormData.status || ''}
                            onValueChange={(value) => setStudentFormData({ ...studentFormData, status: value })}
                            required
                          >
                            <SelectTrigger className="mt-1 border-gray-200">
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

                      <div className="space-y-5">
                        <div>
                          <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                            Voornaam <span className="text-primary">*</span>
                          </Label>
                          <Input
                            id="firstName"
                            required
                            value={studentFormData.firstName}
                            onChange={(e) => setStudentFormData({ ...studentFormData, firstName: e.target.value })}
                            className="mt-1 border-gray-200"
                            placeholder="Voer voornaam in"
                          />
                        </div>

                        <div>
                          <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                            Achternaam <span className="text-primary">*</span>
                          </Label>
                          <Input
                            id="lastName"
                            required
                            value={studentFormData.lastName}
                            onChange={(e) => setStudentFormData({ ...studentFormData, lastName: e.target.value })}
                            className="mt-1 border-gray-200"
                            placeholder="Voer achternaam in"
                          />
                        </div>

                        <div>
                          <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                            Geboortedatum <span className="text-primary">*</span>
                          </Label>
                          <Input
                            id="dateOfBirth"
                            placeholder="DD/MM/JJJJ"
                            required
                            value={studentFormData.dateOfBirth ? formatDateToDisplayFormat(studentFormData.dateOfBirth) : ''}
                            onChange={(e) => {
                              const formattedDate = formatDateToDatabaseFormat(e.target.value);
                              setStudentFormData({ ...studentFormData, dateOfBirth: formattedDate || '' });
                            }}
                            className="mt-1 border-gray-200"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-1/2 space-y-5">
                      <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                        <Label htmlFor="gender" className="text-sm font-medium text-gray-700 mb-3 block">
                          Geslacht <span className="text-primary">*</span>
                        </Label>
                        <div className="flex gap-8 items-center mt-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="gender-man"
                              name="gender"
                              checked={studentFormData.gender === 'man'}
                              onChange={() => setStudentFormData({ ...studentFormData, gender: 'man' })}
                              className="h-5 w-5 text-primary focus:ring-primary"
                              required
                            />
                            <Label htmlFor="gender-man" className="font-medium">Man</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="gender-vrouw"
                              name="gender"
                              checked={studentFormData.gender === 'vrouw'}
                              onChange={() => setStudentFormData({ ...studentFormData, gender: 'vrouw' })}
                              className="h-5 w-5 text-primary focus:ring-primary"
                              required
                            />
                            <Label htmlFor="gender-vrouw" className="font-medium">Vrouw</Label>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                        <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-3 block">
                          Notities
                        </Label>
                        <Textarea
                          id="notes"
                          value={studentFormData.notes || ''}
                          onChange={(e) => setStudentFormData({ ...studentFormData, notes: e.target.value })}
                          className="min-h-[120px] border-gray-200"
                          placeholder="Voeg hier eventuele notities over de student toe..."
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Contact informatie tab */}
                <TabsContent value="contact" className="space-y-6">
                  <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                    <h3 className="text-lg font-semibold text-primary mb-4">Contactgegevens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          E-mail <span className="text-primary">*</span>
                        </Label>
                        <div className="mt-1 relative">
                          <Input
                            id="email"
                            type="email"
                            required
                            value={studentFormData.email}
                            onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                            className="border-gray-200 pl-9"
                            placeholder="naam@voorbeeld.nl"
                          />
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Telefoonnummer <span className="text-primary">*</span>
                        </Label>
                        <div className="mt-1 relative">
                          <Input
                            id="phone"
                            required
                            value={studentFormData.phone || ''}
                            onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                            className="border-gray-200 pl-9"
                            placeholder="06 12345678"
                          />
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Adres informatie tab */}
                <TabsContent value="address" className="space-y-6">
                  <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                    <h3 className="text-lg font-semibold text-primary mb-4">Adresgegevens</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="street" className="text-sm font-medium text-gray-700">
                            Straatnaam <span className="text-primary">*</span>
                          </Label>
                          <Input
                            id="street"
                            required
                            value={studentFormData.street || ''}
                            onChange={(e) => setStudentFormData({ ...studentFormData, street: e.target.value })}
                            className="mt-1 border-gray-200"
                            placeholder="Leuvensesteenweg"
                          />
                        </div>
                        <div>
                          <Label htmlFor="houseNumber" className="text-sm font-medium text-gray-700">
                            Huisnummer <span className="text-primary">*</span>
                          </Label>
                          <Input
                            id="houseNumber"
                            required
                            value={studentFormData.houseNumber || ''}
                            onChange={(e) => setStudentFormData({ ...studentFormData, houseNumber: e.target.value })}
                            className="mt-1 border-gray-200"
                            placeholder="42"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700">
                            Postcode <span className="text-primary">*</span>
                          </Label>
                          <Input
                            id="postalCode"
                            required
                            value={studentFormData.postalCode || ''}
                            onChange={(e) => setStudentFormData({ ...studentFormData, postalCode: e.target.value })}
                            className="mt-1 border-gray-200"
                            placeholder="1030"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                            Stad <span className="text-primary">*</span>
                          </Label>
                          <Input
                            id="city"
                            required
                            value={studentFormData.city || ''}
                            onChange={(e) => setStudentFormData({ ...studentFormData, city: e.target.value })}
                            className="mt-1 border-gray-200"
                            placeholder="Brussel"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Klas toewijzing tab */}
                <TabsContent value="class" className="space-y-6">
                  <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-primary">Klas Toewijzing</h3>
                      {studentFormData.studentGroupId && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium">
                          Klas toegewezen
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-6">
                      <p className="text-sm text-gray-500">
                        Wijs de student toe aan een klas. Een student kan maar in één klas zitten.
                      </p>
                      
                      <div className="mt-2">
                        <Label htmlFor="studentGroupId" className="text-sm font-medium text-gray-700">
                          Selecteer klas
                        </Label>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Select
                              value={studentFormData.studentGroupId?.toString() || 'none'}
                              onValueChange={(value) => setStudentFormData({ 
                                ...studentFormData, 
                                studentGroupId: value !== 'none' ? parseInt(value) : null 
                              })}
                            >
                              <SelectTrigger className="border-gray-200 bg-white">
                                <SelectValue placeholder="Selecteer klas" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Geen klas</SelectItem>
                                {studentGroups.map((group: {id: number, name: string}) => (
                                  <SelectItem key={group.id} value={String(group.id)}>
                                    {group.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {studentGroups.length === 0 && (
                            <div className="flex items-center text-sm text-amber-600">
                              <p className="italic">Er zijn nog geen klassen aangemaakt.</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {studentFormData.studentGroupId && (
                        <div className="flex items-center p-4 mt-4 rounded-md bg-blue-50 border border-blue-100">
                          <div className="mr-4 p-2 bg-primary rounded-full">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-primary">
                              {studentGroups.find((g: any) => g.id === studentFormData.studentGroupId)?.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              De student wordt toegewezen aan deze klas
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Vakken tab */}
                <TabsContent value="courses" className="space-y-6">
                  <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-primary">Vakken</h3>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium">
                        {selectedPrograms.length} vakken geselecteerd
                      </Badge>
                    </div>
                    
                    {/* Lijst met toegevoegde programma's */}
                    {selectedPrograms.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {selectedPrograms.map((program, index) => {
                          const programInfo = programs.find((p: any) => p.id === program.programId);
                          const groupInfo = program.studentGroupId ? studentGroups.find((g: any) => g.id === program.studentGroupId) : null;
                          return (
                            <div key={index} className="flex items-center justify-between border rounded-md p-4 bg-blue-50/50 border-blue-100 hover:shadow-sm transition-shadow">
                              <div>
                                <div className="font-medium text-primary">{programInfo?.name}</div>
                                <div className="flex flex-col space-y-1">
                                  {program.yearLevel && (
                                    <div className="text-sm text-gray-500">Jaar: {program.yearLevel}</div>
                                  )}
                                  {groupInfo && (
                                    <div className="text-sm text-gray-600 font-medium">
                                      Klas: {groupInfo.name}
                                    </div>
                                  )}
                                  <Badge variant={program.status === 'active' ? 'success' : 'outline'} className="w-fit">
                                    {program.status === 'active' ? 'Actief' : program.status === 'inactive' ? 'Inactief' : program.status}
                                  </Badge>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50"
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
                    <div className="mt-6 p-4 border rounded-md border-dashed border-gray-300 bg-gray-50">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Vak toevoegen</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="newProgramId" className="text-xs text-gray-500">Vak</Label>
                          <Select
                            value={studentFormData.programId?.toString() || ''}
                            onValueChange={handleProgramIdChange}
                          >
                            <SelectTrigger className="mt-1 border-gray-200 bg-white">
                              <SelectValue placeholder="Selecteer vak" />
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
                          <Label htmlFor="newYearLevel" className="text-xs text-gray-500">Studiejaar</Label>
                          <Select
                            value={studentFormData.yearLevel?.toString() || ''}
                            onValueChange={handleYearLevelChange}
                            disabled={!studentFormData.programId}
                          >
                            <SelectTrigger className="mt-1 border-gray-200 bg-white">
                              <SelectValue placeholder={!studentFormData.programId ? "Selecteer eerst vak" : "Selecteer jaar"} />
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
                            className="w-full border-primary/50 text-primary hover:bg-primary/5"
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
                                      studentGroupId: studentFormData.studentGroupId,
                                      status: 'active'
                                    }
                                  ]);
                                  
                                  // Reset de programId, yearLevel en studentGroupId voor de volgende toevoeging
                                  setStudentFormData({
                                    ...studentFormData,
                                    programId: null,
                                    yearLevel: null,
                                    studentGroupId: null
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
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Vak toevoegen
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="mt-8 pt-4 border-t">
              <div className="flex items-center text-xs text-gray-500 mr-auto">
                <span className="text-primary font-bold mr-1">*</span> Verplichte velden
              </div>
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
                className="ml-2 gap-2"
              >
                {createStudentMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Bezig met toevoegen...
                  </>
                ) : (
                  <>
                    <UserCircle className="h-4 w-4" />
                    Student toevoegen
                  </>
                )}
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
                        <AvatarFallback className="text-2xl">
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
                        <p className="font-medium">{selectedStudent.dateOfBirth ? formatDateToDisplayFormat(selectedStudent.dateOfBirth) : "Niet ingevuld"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Inschrijvingsdatum</h3>
                        <p className="font-medium">{selectedStudent.enrollmentDate ? formatDateToDisplayFormat(selectedStudent.enrollmentDate) : "Niet ingevuld"}</p>
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
