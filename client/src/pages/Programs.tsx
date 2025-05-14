import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, ChevronDown, ChevronUp, Edit, Trash2, Clock, Users, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';

interface Program {
  id: string;
  name: string;
  code: string;
  department: string;
  description: string;
  duration: number;
  totalCredits: number;
  students: number;
  startDate: string;
  courses: {
    id: string;
    name: string;
    code: string;
    credits: number;
    semester: number;
  }[];
}

export default function Programs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  // Fetch programs
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/programs', { searchTerm }],
    staleTime: 30000,
  });

  const programs = data?.programs || [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const toggleExpand = (programId: string) => {
    if (expandedProgram === programId) {
      setExpandedProgram(null);
    } else {
      setExpandedProgram(programId);
    }
  };

  const handleAddProgram = () => {
    // Implementation will be added for program creation
    console.log('Add program clicked');
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Programmabeheer</h1>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Zoek programma's..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button onClick={handleAddProgram} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Programma Toevoegen</span>
          </Button>
        </div>
      </div>

      {/* Program list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-red-500">
            Fout bij het laden van programma's. Probeer het opnieuw.
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Geen programma's gevonden. Pas je zoekopdracht aan of voeg een nieuw programma toe.
          </div>
        ) : (
          programs.map((program: Program) => (
            <div key={program.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(program.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium text-gray-800">{program.name}</h3>
                    <span className="ml-3 bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded">{program.code}</span>
                  </div>
                  <p className="text-gray-500 text-sm mt-1">{program.department}</p>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center hidden md:block">
                    <span className="text-gray-500 text-xs block">Duur</span>
                    <span className="text-gray-800 font-medium">{program.duration} jaar</span>
                  </div>
                  <div className="text-center hidden md:block">
                    <span className="text-gray-500 text-xs block">Totaal Studiepunten</span>
                    <span className="text-gray-800 font-medium">{program.totalCredits}</span>
                  </div>
                  <div className="text-center hidden md:block">
                    <span className="text-gray-500 text-xs block">Studenten</span>
                    <span className="text-gray-800 font-medium">{program.students}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-gray-500">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {expandedProgram === program.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              {expandedProgram === program.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center">
                      <Clock className="h-5 w-5 text-primary mr-3" />
                      <div>
                        <span className="text-xs text-gray-500 block">Duur</span>
                        <span className="text-sm font-medium">{program.duration} jaar ({program.totalCredits} studiepunten)</span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center">
                      <Users className="h-5 w-5 text-primary mr-3" />
                      <div>
                        <span className="text-xs text-gray-500 block">Ingeschreven Studenten</span>
                        <span className="text-sm font-medium">{program.students} studenten</span>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center">
                      <Calendar className="h-5 w-5 text-primary mr-3" />
                      <div>
                        <span className="text-xs text-gray-500 block">Volgende Startdatum</span>
                        <span className="text-sm font-medium">{program.startDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                      <BookOpen className="h-5 w-5 text-primary mr-2" />
                      Cursusstructuur
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cursuscode</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cursusnaam</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Studiepunten</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Semester</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {program.courses.map((course) => (
                            <tr key={course.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{course.code}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{course.name}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{course.credits}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{course.semester}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Beschrijving</h4>
                    <p className="text-sm text-gray-600">{program.description}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
