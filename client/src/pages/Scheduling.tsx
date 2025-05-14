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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Roosterbeheer</h1>
          <p className="text-gray-500 mt-1">
            Beheer cursusroosters, lokalen en lesschema's
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Zoek roosters..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button onClick={handleAddSchedule} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Rooster Toevoegen</span>
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
                {isLoading ? 'Laden...' : `Toont ${schedules.length} van ${totalSchedules} roosters`}
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        Loading schedules...
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-red-500">
                        Error loading schedules. Please try again.
                      </td>
                    </tr>
                  ) : schedules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No schedules found with the current filters. Try changing your search or filters.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* Schedule Entry 1 */}
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">CS101: Intro to Programming</div>
                          <div className="text-xs text-gray-500">Computer Science</div>
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
                          <div className="text-sm text-gray-900">Monday</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">9:00 AM - 10:30 AM</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Schedule Entry 2 */}
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">MATH101: Calculus I</div>
                          <div className="text-xs text-gray-500">Mathematics</div>
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
                          <div className="text-sm text-gray-900">Tuesday</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">11:00 AM - 12:30 PM</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Schedule Entry 3 */}
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">CS201: Data Structures</div>
                          <div className="text-xs text-gray-500">Computer Science</div>
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
                          <div className="text-sm text-gray-900">Wednesday</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">2:00 PM - 3:30 PM</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
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
            {totalPages > 1 && (
              <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * 10, totalSchedules)}
                      </span>{" "}
                      of <span className="font-medium">{totalSchedules}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-l-md"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <Button 
                          key={i}
                          variant={currentPage === i + 1 ? "default" : "outline"} 
                          size="sm"
                          onClick={() => handlePageChange(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-r-md"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="room-allocation">
          <Card>
            <CardHeader>
              <CardTitle>Room Allocation</CardTitle>
              <CardDescription>
                View and manage classroom allocations and equipment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Building</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">A101</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Science Building</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">35</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-blue-100 text-blue-800">Lecture Hall</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Projector, Smart Board</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-green-100 text-green-800">Available</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4 text-blue-500" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">B201</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Math Building</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">30</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-yellow-100 text-yellow-800">Classroom</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Projector, Whiteboard</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-green-100 text-green-800">Available</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4 text-blue-500" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">C305</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">Computer Building</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">25</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-purple-100 text-purple-800">Computer Lab</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">25 Computers, Projector</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-red-100 text-red-800">Maintenance</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4 text-blue-500" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <Button variant="outline">Add New Room</Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Room Data
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="instructor-schedule">
          <Card>
            <CardHeader>
              <CardTitle>Instructor Schedule</CardTitle>
              <CardDescription>
                View and manage instructor teaching schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Instructor 1 */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>AT</AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <h3 className="font-medium text-gray-900">Dr. Alan Turing</h3>
                        <p className="text-sm text-gray-500">Computer Science Department</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Full-time</Badge>
                  </div>
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Teaching Schedule</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-24 text-xs text-gray-500">Monday</div>
                        <div className="flex-1">
                          <Badge className="mr-2">9:00 AM - 10:30 AM</Badge>
                          <span className="text-sm">CS101: Intro to Programming (A101)</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-24 text-xs text-gray-500">Wednesday</div>
                        <div className="flex-1">
                          <Badge className="mr-2">9:00 AM - 10:30 AM</Badge>
                          <span className="text-sm">CS101: Intro to Programming (A101)</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-24 text-xs text-gray-500">Friday</div>
                        <div className="flex-1">
                          <Badge className="mr-2">1:00 PM - 2:30 PM</Badge>
                          <span className="text-sm">CS301: Algorithms (B103)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Total Teaching Hours: </span>
                        <span className="text-sm">9 hours/week</span>
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Schedule
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Instructor 2 */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>GH</AvatarFallback>
                      </Avatar>
                      <div className="ml-4">
                        <h3 className="font-medium text-gray-900">Dr. Grace Hopper</h3>
                        <p className="text-sm text-gray-500">Mathematics Department</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Part-time</Badge>
                  </div>
                  <div className="px-4 py-3 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Teaching Schedule</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-24 text-xs text-gray-500">Tuesday</div>
                        <div className="flex-1">
                          <Badge className="mr-2">11:00 AM - 12:30 PM</Badge>
                          <span className="text-sm">MATH101: Calculus I (B201)</span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-24 text-xs text-gray-500">Thursday</div>
                        <div className="flex-1">
                          <Badge className="mr-2">11:00 AM - 12:30 PM</Badge>
                          <span className="text-sm">MATH101: Calculus I (B201)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Total Teaching Hours: </span>
                        <span className="text-sm">6 hours/week</span>
                      </div>
                      <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Schedule
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}