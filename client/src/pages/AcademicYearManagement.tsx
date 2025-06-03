import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Plus,
  Calendar,
  Edit,
  Trash2
} from 'lucide-react';
import { PremiumHeader } from '@/components/layout/premium-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  registrationStartDate: string;
  registrationEndDate: string;
  finalReportDate: string;
  description?: string;
}

interface Holiday {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  academicYearId: number;
  type: 'vacation' | 'public_holiday' | 'study_break';
  description?: string;
}

export default function AcademicYearManagement() {
  const [searchTerm, setSearchTerm] = useState('');

  // Data fetching
  const { data: academicYearsData = [], isLoading: yearsLoading } = useQuery({
    queryKey: ['/api/academic-years']
  });

  const { data: holidaysData = [], isLoading: holidaysLoading } = useQuery({
    queryKey: ['/api/holidays']
  });

  // Event handlers
  const handleEditYear = (year: AcademicYear) => {
    console.log('Edit year:', year);
  };

  const handleDeleteYear = (year: AcademicYear) => {
    console.log('Delete year:', year);
  };

  const handleEditHoliday = (holiday: Holiday) => {
    console.log('Edit holiday:', holiday);
  };

  const handleDeleteHoliday = (holiday: Holiday) => {
    console.log('Delete holiday:', holiday);
  };

  const getStatusBadge = (year: AcademicYear) => {
    if (year.isActive) {
      return <Badge className="bg-green-100 text-green-800">Actief</Badge>;
    }
    return <Badge variant="secondary">Inactief</Badge>;
  };

  // Filter data based on search
  const filteredYears = academicYearsData.filter((year: AcademicYear) =>
    year.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHolidays = holidaysData.filter((holiday: Holiday) =>
    holiday.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PremiumHeader 
        title="Schooljaar Beheer"
        subtitle="Beheer schooljaren en vakanties"
        icon={Calendar}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Zoek schooljaren..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Schooljaar Toevoegen
          </Button>
        </div>

        {/* Academic Years Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Schooljaren</CardTitle>
                <CardDescription>Beheer de schooljaren van uw instelling</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {yearsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Schooljaren laden...</p>
              </div>
            ) : filteredYears.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen schooljaren</h3>
                <p className="text-gray-500 mb-4">Begin met het toevoegen van je eerste schooljaar.</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schooljaar Toevoegen
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredYears.map((year: AcademicYear) => (
                  <div key={year.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{year.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(year.startDate).toLocaleDateString('nl-NL')} - {new Date(year.endDate).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(year)}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditYear(year)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteYear(year)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Holidays Section */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Schoolvakanties</CardTitle>
                <CardDescription>Beheer vakanties en vrije dagen</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {holidaysLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Vakanties laden...</p>
              </div>
            ) : filteredHolidays.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen vakanties</h3>
                <p className="text-gray-500 mb-4">Begin met het toevoegen van schoolvakanties.</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Vakantie Toevoegen
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHolidays.map((holiday: Holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{holiday.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(holiday.startDate).toLocaleDateString('nl-NL')} - {new Date(holiday.endDate).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {holiday.type}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditHoliday(holiday)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteHoliday(holiday)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}