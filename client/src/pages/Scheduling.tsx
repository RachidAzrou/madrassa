import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, Calendar, Clock, Users, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { apiRequest } from '@/lib/queryClient';

export default function Scheduling() {
  const [searchTerm, setSearchTerm] = useState('');
  const [course, setCourse] = useState('all');
  const [instructor, setInstructor] = useState('all');
  const [room, setRoom] = useState('all');
  const [day, setDay] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('course-schedule');

  // Fetch schedules with filters
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/scheduling', { searchTerm, course, instructor, room, day, page: currentPage, type: activeTab }],
    staleTime: 30000,
  });

  // Fetch courses for filter
  const { data: coursesData } = useQuery({
    queryKey: ['/api/courses'],
  });

  // Fetch instructors for filter
  const { data: instructorsData } = useQuery({
    queryKey: ['/api/instructors'],
  });

  // Fetch rooms for filter
  const { data: roomsData } = useQuery({
    queryKey: ['/api/rooms'],
  });

  const schedules = data?.schedules || [];
  const totalSchedules = data?.totalCount || 0;
  const totalPages = Math.ceil(totalSchedules / 10);
  
  const courses = coursesData?.courses || [];
  const instructors = instructorsData?.instructors || [];
  const rooms = roomsData?.rooms || [];

  const handleAddSchedule = async () => {
    // Implementation will be added for schedule creation
    console.log('Add schedule clicked');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleCourseChange = (value: string) => {
    setCourse(value);
    setCurrentPage(1);
  };

  const handleInstructorChange = (value: string) => {
    setInstructor(value);
    setCurrentPage(1);
  };

  const handleRoomChange = (value: string) => {
    setRoom(value);
    setCurrentPage(1);
  };

  const handleDayChange = (value: string) => {
    setDay(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center">
            <div className="mr-3 text-[#1e3a8a] bg-blue-100 rounded-lg p-2">
              <Clock className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1e3a8a]">Planning</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-11">
            Beheer cursusroosters, lokalen en lesschema's
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Zoek planning..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button 
            onClick={handleAddSchedule} 
            variant="default"
            size="default"
            className="bg-primary hover:bg-primary/90 flex items-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Planning Toevoegen</span>
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-full mr-4">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Totaal Lessen</p>
                <p className="text-2xl font-semibold">458</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-full mr-4">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Actieve Lokalen</p>
                <p className="text-2xl font-semibold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-full mr-4">
                <Repeat className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Wekelijkse Lessen</p>
                <p className="text-2xl font-semibold">187</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="course-schedule">Cursusrooster</TabsTrigger>
          <TabsTrigger value="room-allocation">Lokalenverdeling</TabsTrigger>
          <TabsTrigger value="instructor-schedule">Docentenrooster</TabsTrigger>
        </TabsList>
        
        <TabsContent value="course-schedule" className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cursus</label>
                <Select value={course} onValueChange={handleCourseChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Cursussen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Cursussen</SelectItem>
                    <SelectItem value="cs101">CS101: Inleiding Programmeren</SelectItem>
                    <SelectItem value="cs201">CS201: Datastructuren</SelectItem>
                    <SelectItem value="math101">MATH101: Calculus I</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Docent</label>
                <Select value={instructor} onValueChange={handleInstructorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Docenten" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Docenten</SelectItem>
                    <SelectItem value="prof1">Dr. Alan Turing</SelectItem>
                    <SelectItem value="prof2">Dr. Grace Hopper</SelectItem>
                    <SelectItem value="prof3">Dr. John von Neumann</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lokaal</label>
                <Select value={room} onValueChange={handleRoomChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Lokalen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Lokalen</SelectItem>
                    <SelectItem value="a101">A101</SelectItem>
                    <SelectItem value="b201">B201</SelectItem>
                    <SelectItem value="c305">C305</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dag</label>
                <Select value={day} onValueChange={handleDayChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Dagen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Dagen</SelectItem>
                    <SelectItem value="monday">Maandag</SelectItem>
                    <SelectItem value="tuesday">Dinsdag</SelectItem>
                    <SelectItem value="wednesday">Woensdag</SelectItem>
                    <SelectItem value="thursday">Donderdag</SelectItem>
                    <SelectItem value="friday">Vrijdag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {isLoading ? 'Laden...' : `Toont ${schedules.length} van ${totalSchedules} planningen`}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filteren
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exporteren
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cursus</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Docent</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokaal</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dag</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tijd</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        Planning laden...
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-red-500">
                        Fout bij het laden van planning. Probeer het opnieuw.
                      </td>
                    </tr>
                  ) : schedules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        Geen planning gevonden met de huidige filters. Probeer je zoekopdracht of filters aan te passen.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* Schedule Entry 1 */}
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">CS101: Inleiding Programmeren</div>
                          <div className="text-xs text-gray-500">Informatica</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>AT</AvatarFallback>
                            </Avatar>
                            <span className="ml-2 text-sm text-gray-900">Dr. Alan Turing</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge>A101</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Maandag</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">9:00 - 10:30</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">Bekijken</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">Bewerken</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Verwijderen</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Schedule Entry 2 */}
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">MATH101: Calculus I</div>
                          <div className="text-xs text-gray-500">Wiskunde</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>GH</AvatarFallback>
                            </Avatar>
                            <span className="ml-2 text-sm text-gray-900">Dr. Grace Hopper</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge>B201</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Dinsdag</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">11:00 - 12:30</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">Bekijken</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">Bewerken</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Verwijderen</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Schedule Entry 3 */}
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">CS201: Datastructuren</div>
                          <div className="text-xs text-gray-500">Informatica</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>JN</AvatarFallback>
                            </Avatar>
                            <span className="ml-2 text-sm text-gray-900">Dr. John von Neumann</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge>C305</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Woensdag</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">14:00 - 15:30</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">Bekijken</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">Bewerken</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Verwijderen</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Vorige
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Volgende
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Pagina <span className="font-medium">{currentPage}</span> van{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginering">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="rounded-l-md"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Vorige
                    </Button>
                    {/* Page numbers would go here */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="rounded-r-md"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Volgende
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="room-allocation">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h3 className="text-lg font-medium text-gray-700">Lokalentoewijzing</h3>
            <p className="mt-2 text-gray-500">Bekijk en beheer lokaalverdeling en apparatuur</p>
          </div>
        </TabsContent>
        
        <TabsContent value="instructor-schedule">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h3 className="text-lg font-medium text-gray-700">Docentenrooster</h3>
            <p className="mt-2 text-gray-500">Bekijk en beheer docentenschema's en beschikbaarheid</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}