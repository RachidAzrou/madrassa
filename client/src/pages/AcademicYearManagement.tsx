import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Plus,
  Calendar,
  Edit,
  Trash2,
  Clock
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      return <Badge className="bg-green-100 text-green-800 text-xs">Actief</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-600 text-xs">Inactief</Badge>;
  };

  // Filter data based on search
  const filteredYears = (academicYearsData as any[]).filter((year: AcademicYear) =>
    year.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHolidays = (holidaysData as any[]).filter((holiday: Holiday) =>
    holiday.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      <PageHeader 
        title="Schooljaar Beheer"
        icon={<Calendar className="h-4 w-4 text-white" />}
        current="Schooljaar Beheer"
      />

      {/* Main content area */}
      <div className="px-6 py-6 max-w-7xl mx-auto w-full">

        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
            <Input
              placeholder="Zoek schooljaren..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs border-[#e5e7eb] rounded-sm"
            />
          </div>
          <Button className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white h-8 text-xs px-3 rounded-sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Schooljaar Toevoegen
          </Button>
        </div>

        {/* Academic Years Section */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm mb-4">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#e5e7eb] bg-[#f9fafc]">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-[#1e40af]" />
              <h3 className="text-xs font-medium text-gray-700 tracking-tight">Schooljaren</h3>
            </div>
            <span className="text-xs text-gray-500">{filteredYears.length} schooljaren</span>
          </div>

          <div className="p-4">
            {yearsLoading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredYears.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center">
                <div className="p-2 bg-[#f7f9fc] text-[#1e40af] mb-3 border border-[#e5e7eb] rounded-sm">
                  <Calendar className="h-5 w-5 opacity-60" />
                </div>
                <p className="text-xs text-gray-500 mb-2">Geen schooljaren beschikbaar</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] h-6 border-[#e5e7eb] text-gray-600 hover:bg-gray-50 rounded-sm"
                >
                  Maak een schooljaar aan
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredYears.map((year: AcademicYear) => (
                  <div key={year.id} className="flex items-center justify-between p-3 border border-[#e5e7eb] rounded-sm hover:bg-[#f8f9fa] transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-800">{year.name}</h4>
                        {getStatusBadge(year)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(year.startDate).toLocaleDateString('nl-NL')} - {new Date(year.endDate).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => handleEditYear(year)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteYear(year)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Holidays Section */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#e5e7eb] bg-[#f9fafc]">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-[#1e40af]" />
              <h3 className="text-xs font-medium text-gray-700 tracking-tight">Schoolvakanties</h3>
            </div>
            <span className="text-xs text-gray-500">{filteredHolidays.length} vakanties</span>
          </div>

          <div className="p-4">
            {holidaysLoading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredHolidays.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center">
                <div className="p-2 bg-[#f7f9fc] text-[#1e40af] mb-3 border border-[#e5e7eb] rounded-sm">
                  <Clock className="h-5 w-5 opacity-60" />
                </div>
                <p className="text-xs text-gray-500 mb-2">Geen vakanties beschikbaar</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] h-6 border-[#e5e7eb] text-gray-600 hover:bg-gray-50 rounded-sm"
                >
                  Vakantie toevoegen
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHolidays.map((holiday: Holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between p-3 border border-[#e5e7eb] rounded-sm hover:bg-[#f8f9fa] transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-800">{holiday.name}</h4>
                        <div className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-sm">
                          {holiday.type}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(holiday.startDate).toLocaleDateString('nl-NL')} - {new Date(holiday.endDate).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => handleEditHoliday(holiday)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteHoliday(holiday)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}