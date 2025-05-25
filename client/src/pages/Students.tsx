import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveTable } from '@/components/ui/data-table-responsive';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, Plus, Search, XCircle } from 'lucide-react';
import { DataTableContainer, SearchActionBar } from '@/components/ui/data-table-container';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  status: string;
  enrollmentDate: string;
  program: string;
}

export default function StudentsPage() {
  // State voor filtering
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  
  // Voorbeeld data - in een echte applicatie zou dit van een API komen
  const [students, setStudents] = useState<Student[]>([
    {
      id: 1,
      studentId: '001',
      firstName: 'Zaina',
      lastName: 'El Mouden',
      email: 'zaina@example.com',
      phone: '0612345678',
      dateOfBirth: '2010-05-15',
      gender: 'Vrouw',
      status: 'Ingeschreven',
      enrollmentDate: '2023-09-01',
      program: 'Islamitische Studies'
    },
    {
      id: 2,
      studentId: '002',
      firstName: 'Mohammed',
      lastName: 'Bouali',
      email: 'mohammed@example.com',
      phone: '0612345679',
      dateOfBirth: '2011-03-20',
      gender: 'Man',
      status: 'Ingeschreven',
      enrollmentDate: '2023-09-01',
      program: 'Arabische Taal'
    },
    {
      id: 3,
      studentId: '003',
      firstName: 'Fatima',
      lastName: 'El Haddioui',
      email: 'fatima@example.com',
      phone: '0612345680',
      dateOfBirth: '2009-07-10',
      gender: 'Vrouw',
      status: 'Uitgeschreven',
      enrollmentDate: '2022-09-01',
      program: 'Islamitische Studies'
    },
    {
      id: 4,
      studentId: '004',
      firstName: 'Ahmed',
      lastName: 'Benali',
      email: 'ahmed@example.com',
      phone: '0612345681',
      dateOfBirth: '2008-12-05',
      gender: 'Man',
      status: 'Afgestudeerd',
      enrollmentDate: '2021-09-01',
      program: 'Koraan Memorisatie'
    },
    {
      id: 5,
      studentId: '005',
      firstName: 'Nora',
      lastName: 'Amrani',
      email: 'nora@example.com',
      phone: '0612345682',
      dateOfBirth: '2012-02-25',
      gender: 'Vrouw',
      status: 'Geschorst',
      enrollmentDate: '2023-09-01',
      program: 'Arabische Taal'
    }
  ]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedStudents = localStorage.getItem('students');
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    }
  }, []);

  // Save data to localStorage when students change
  useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
    console.log('Studenten opgeslagen in localStorage:', students.length);
  }, [students]);

  // Gefilterde studenten
  const filteredStudents = students.filter(student => 
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status badge helper functie
  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'Ingeschreven': 'bg-green-100 text-green-800',
      'Uitgeschreven': 'bg-gray-100 text-gray-800',
      'Afgestudeerd': 'bg-blue-100 text-blue-800',
      'Geschorst': 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100'}>
        {status}
      </Badge>
    );
  };

  // Kolom definities
  const columns = [
    {
      key: 'studentId',
      header: 'Student ID',
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    {
      key: 'firstName',
      header: 'Voornaam',
      hideOnMobile: true
    },
    {
      key: 'lastName',
      header: 'Achternaam',
      hideOnMobile: true
    },
    {
      key: 'fullName',
      header: 'Naam',
      hideOnDesktop: true,
      render: (_: any, item: Student) => `${item.firstName} ${item.lastName}`
    },
    {
      key: 'email',
      header: 'Email',
      hideOnMobile: true
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'program',
      header: 'Programma',
      hideOnMobile: true
    }
  ];

  // Mobiele veld definities
  const mobileFields = [
    {
      key: 'studentId',
      label: 'Student ID'
    },
    {
      key: 'name',
      label: 'Naam',
      render: (value: any) => `${value.firstName} ${value.lastName}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'program',
      label: 'Programma'
    }
  ];

  // Actie functies
  const handleAddStudent = () => {
    toast({
      title: "Functie niet geïmplementeerd",
      description: "Toevoegen van studenten is nog niet geïmplementeerd.",
    });
  };

  const handleViewStudent = (student: Student) => {
    toast({
      title: "Student details",
      description: `Details van ${student.firstName} ${student.lastName} bekijken`,
    });
  };

  const handleEditStudent = (student: Student) => {
    toast({
      title: "Student bewerken",
      description: `${student.firstName} ${student.lastName} bewerken`,
    });
  };

  const handleDeleteStudent = (student: Student) => {
    toast({
      title: "Student verwijderen",
      description: `${student.firstName} ${student.lastName} verwijderen`,
    });
  };

  // Acties functie
  const renderActions = (student: Student) => (
    <div className="flex gap-1 justify-end">
      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handleViewStudent(student)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditStudent(student)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => handleDeleteStudent(student)} data-testid={`delete-${student.id}`}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <DataTableContainer>
      <h1 className="text-2xl font-bold mb-6">Studenten</h1>
      
      {/* Zoek- en actie balk */}
      <SearchActionBar>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Zoek studenten..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 md:w-80 w-full"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5"
            >
              <XCircle className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
        <Button onClick={handleAddStudent}>
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Student
        </Button>
      </SearchActionBar>
      
      {/* Responsieve tabel */}
      <ResponsiveTable
        data={filteredStudents}
        columns={columns}
        renderActions={renderActions}
        emptyState={
          <div className="text-center py-8">
            <p className="text-gray-500 font-medium">Geen studenten gevonden</p>
            <Button onClick={handleAddStudent} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Student
            </Button>
          </div>
        }
      />
    </DataTableContainer>
  );
}