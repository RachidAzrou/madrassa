import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { ResponsiveTable } from '@/components/ui/data-table-responsive';
import { DataTableContainer } from '@/components/ui/data-table-container';

interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  enrollmentDate: string;
  program: string;
}

export default function ResponsiveTableExample() {
  // Voorbeeld data
  const [students, setStudents] = useState<Student[]>([
    {
      id: 1,
      studentId: '001',
      firstName: 'Zaina',
      lastName: 'El Mouden',
      email: 'zaina@example.com',
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
      status: 'Geschorst',
      enrollmentDate: '2023-09-01',
      program: 'Arabische Taal'
    }
  ]);

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
      key: 'fullName',
      label: 'Naam',
      render: (item: Student) => `${item.firstName} ${item.lastName}`
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

  // Acties functie
  const renderActions = (student: Student) => (
    <div className="flex gap-1 justify-end">
      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" className="h-8 w-8 p-0" data-testid={`delete-${student.id}`}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <DataTableContainer>
      <h1 className="text-2xl font-bold mb-6">Responsieve Tabel Voorbeeld</h1>
      <p className="text-gray-600 mb-6">
        Deze tabel verandert automatisch in een kaartweergave op mobiele apparaten, 
        zodat je niet horizontaal hoeft te scrollen.
      </p>
      
      <ResponsiveTable
        data={students}
        columns={columns}
        renderActions={renderActions}
        mobileFields={mobileFields}
      />
    </DataTableContainer>
  );
}