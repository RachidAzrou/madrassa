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
  const [activeTab, setActiveTab] = useState('instructor-schedule');

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
          <TabsTrigger value="instructor-schedule">Docentenrooster</TabsTrigger>
          <TabsTrigger value="room-allocation">Lokalenverdeling</TabsTrigger>
        </TabsList>
        
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