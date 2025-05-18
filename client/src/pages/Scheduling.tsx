import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, 
  Calendar, Clock, Users, Repeat, Landmark, GraduationCap, 
  Building, BookOpen, ChevronRight, MapPin, Check, X,
  AlertCircle, Calendar as CalendarIcon
} from 'lucide-react';
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
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Type definities voor betere type veiligheid
interface TeacherSchedule {
  id: number;
  teacherId: string;
  instructorName: string;
  courseId: number;
  courseName: string;
  classId: number;
  className: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  roomId: number;
  roomName: string;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Room {
  id: number;
  name: string;
  capacity: number;
  location: string;
  status: 'available' | 'occupied' | 'reserved';
  currentUse?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Teacher {
  id: number;
  teacherId: string;
  firstName: string;
  lastName: string;
  email: string;
  fullName: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
  programId: number | null;
}

interface StudentGroup {
  id: number;
  name: string;
  academicYear: string;
}

export default function Scheduling() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [course, setCourse] = useState('all');
  const [instructor, setInstructor] = useState('all');
  const [room, setRoom] = useState('all');
  const [day, setDay] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('instructor-schedule');
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month'>('today');
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [dialogActiveTab, setDialogActiveTab] = useState('instructor-schedule');
  const [selectedSchedule, setSelectedSchedule] = useState<TeacherSchedule | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Docenten toewijzing
    teacherId: '',
    courseId: '',
    classId: '',
    selectedDays: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false, 
      friday: false,
      saturday: false,
      sunday: false
    },
    roomId: '',
    startTime: '09:00',
    endTime: '10:30',
    repeat: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
    
    // Lokalen toewijzing
    roomName: '',
    capacity: 30,
    location: '',
    status: 'available' as 'available' | 'occupied' | 'reserved',
    toewijzingsCategorie: 'vak',  // 'vak' of 'klas'
    assignmentId: '',
    description: '',
    notes: ''
  });

  // Fetch schedules with filters
  const { data: schedulesData, isLoading, isError } = useQuery({
    queryKey: ['/api/scheduling', { 
      searchTerm, 
      course, 
      instructor, 
      room, 
      day, 
      page: currentPage, 
      type: activeTab,
      viewMode 
    }],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          searchTerm,
          page: currentPage.toString(),
          type: activeTab,
          viewMode
        });
        
        if (course !== 'all') params.append('courseId', course);
        if (instructor !== 'all') params.append('teacherId', instructor);
        if (room !== 'all') params.append('roomId', room);
        if (day !== 'all') params.append('day', day);
        
        const result = await apiRequest(`/api/scheduling?${params.toString()}`, {
          method: 'GET'
        });
        return result;
      } catch (error: any) {
        console.error('Error fetching scheduling data:', error);
        toast({
          title: "Fout bij ophalen planning",
          description: error?.message || "Er is een fout opgetreden bij het ophalen van de planningsgegevens.",
          variant: "destructive",
        });
        return { schedules: [], totalCount: 0 };
      }
    },
    staleTime: 30000,
  });

  // Fetch courses for filter
  const { data: coursesData } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/courses', {
          method: 'GET'
        });
      } catch (error: any) {
        console.error('Error fetching courses:', error);
        toast({
          title: "Fout bij ophalen cursussen",
          description: error?.message || "Er is een fout opgetreden bij het ophalen van de cursussen.",
          variant: "destructive",
        });
        return { courses: [] };
      }
    },
  });

  // Fetch teachers for filter
  const { data: teachersData } = useQuery({
    queryKey: ['/api/teachers'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/teachers', {
          method: 'GET'
        });
      } catch (error: any) {
        console.error('Error fetching teachers:', error);
        toast({
          title: "Fout bij ophalen docenten",
          description: error?.message || "Er is een fout opgetreden bij het ophalen van de docenten.",
          variant: "destructive",
        });
        return { teachers: [] };
      }
    },
  });

  // Fetch student groups for filter
  const { data: studentGroupsData } = useQuery({
    queryKey: ['/api/student-groups'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/student-groups', {
          method: 'GET'
        });
      } catch (error: any) {
        console.error('Error fetching student groups:', error);
        toast({
          title: "Fout bij ophalen klassen",
          description: error?.message || "Er is een fout opgetreden bij het ophalen van de klassen.",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  // Fetch rooms for filter
  const { data: roomsData } = useQuery({
    queryKey: ['/api/rooms'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/rooms', {
          method: 'GET'
        });
      } catch (error: any) {
        console.error('Error fetching rooms:', error);
        toast({
          title: "Fout bij ophalen lokalen",
          description: error?.message || "Er is een fout opgetreden bij het ophalen van de lokalen.",
          variant: "destructive",
        });
        return { rooms: [] };
      }
    },
  });

  const schedules = schedulesData?.schedules || [];
  const totalSchedules = schedulesData?.totalCount || 0;
  const totalPages = Math.ceil(totalSchedules / 10);
  
  const courses = coursesData?.courses || [];
  const teachers = teachersData?.teachers || [];
  const studentGroups = studentGroupsData || [];
  const rooms = roomsData?.rooms || [];

  const handleAddSchedule = () => {
    // Open the dialog
    setIsDialogOpen(true);
    console.log('Add schedule clicked');
  };
  
  // Mutation voor het toevoegen van een docentrooster
  const createTeacherScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        return await apiRequest('/api/scheduling/instructor', {
          method: 'POST',
          body: data
        });
      } catch (error: any) {
        console.error('Error creating teacher schedule:', error);
        throw new Error(error?.message || 'Fout bij het aanmaken van het docentrooster');
      }
    },
    onSuccess: () => {
      toast({
        title: "Docentrooster toegevoegd",
        description: "Het docentrooster is succesvol toegevoegd aan het systeem.",
        variant: "default",
      });
      setIsDialogOpen(false);
      resetFormData();
      
      queryClient.invalidateQueries({ queryKey: ['/api/scheduling'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van het docentrooster.",
        variant: "destructive",
      });
    },
  });

  // Mutation voor het toevoegen van een lokaal
  const createRoomMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        return await apiRequest('/api/rooms', {
          method: 'POST',
          body: data
        });
      } catch (error: any) {
        console.error('Error creating room:', error);
        throw new Error(error?.message || 'Fout bij het aanmaken van het lokaal');
      }
    },
    onSuccess: () => {
      toast({
        title: "Lokaal toegevoegd",
        description: "Het lokaal is succesvol toegevoegd aan het systeem.",
        variant: "default",
      });
      setIsDialogOpen(false);
      resetFormData();
      
      queryClient.invalidateQueries({ queryKey: ['/api/rooms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/scheduling'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van het lokaal.",
        variant: "destructive",
      });
    },
  });

  // Reset form data
  const resetFormData = () => {
    setFormData({
      teacherId: '',
      courseId: '',
      classId: '',
      selectedDays: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false, 
        friday: false,
        saturday: false,
        sunday: false
      },
      roomId: '',
      startTime: '09:00',
      endTime: '10:30',
      repeat: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
      
      // Lokalen toewijzing
      roomName: '',
      capacity: 30,
      location: '',
      status: 'available' as 'available' | 'occupied' | 'reserved',
      toewijzingsCategorie: 'vak',
      assignmentId: '',
      description: '',
      notes: ''
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Valideer formulier
      if (dialogActiveTab === 'instructor-schedule') {
        if (!formData.teacherId || !formData.courseId || !formData.classId || !formData.roomId) {
          toast({
            title: "Onvolledige gegevens",
            description: "Vul alle verplichte velden in om een docentrooster toe te voegen.",
            variant: "destructive",
          });
          return;
        }
        
        // Controleer of er minstens één dag is geselecteerd
        const hasSelectedDay = Object.values(formData.selectedDays).some(day => day);
        if (!hasSelectedDay) {
          toast({
            title: "Geen dagen geselecteerd",
            description: "Selecteer ten minste één dag voor het rooster.",
            variant: "destructive",
          });
          return;
        }
        
        // Valideer tijden
        if (formData.startTime >= formData.endTime) {
          toast({
            title: "Ongeldige tijd",
            description: "De eindtijd moet na de starttijd liggen.",
            variant: "destructive",
          });
          return;
        }
        
        // Submit instructor schedule
        const selectedTeacher = teachers.find(t => t.id.toString() === formData.teacherId);
        const selectedCourse = courses.find(c => c.id.toString() === formData.courseId);
        const selectedClass = studentGroups.find(g => g.id.toString() === formData.classId);
        const selectedRoom = rooms.find(r => r.id.toString() === formData.roomId);
        
        const scheduleData = {
          teacherId: formData.teacherId,
          instructorName: selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : '',
          courseId: formData.courseId,
          courseName: selectedCourse?.name || '',
          classId: formData.classId,
          className: selectedClass?.name || '',
          roomId: formData.roomId,
          roomName: selectedRoom?.name || '',
          selectedDays: formData.selectedDays,
          startTime: formData.startTime,
          endTime: formData.endTime,
          startDate: formData.startDate,
          endDate: formData.repeat ? formData.endDate : formData.startDate,
          isRecurring: formData.repeat
        };
        
        createTeacherScheduleMutation.mutate(scheduleData);
        
      } else {
        // Valideer voor lokalen
        if (!formData.roomName || !formData.capacity) {
          toast({
            title: "Onvolledige gegevens",
            description: "Vul alle verplichte velden in om een lokaal toe te voegen.",
            variant: "destructive",
          });
          return;
        }
        
        const roomData = {
          name: formData.roomName,
          capacity: formData.capacity,
          location: formData.location,
          status: formData.status,
          notes: formData.notes
        };
        
        createRoomMutation.mutate(roomData);
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: "Fout bij verwerken",
        description: error?.message || "Er is een fout opgetreden bij het verwerken van het formulier.",
        variant: "destructive",
      });
    }
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
  
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-4">
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
      </div>
      
      {/* Geen widgets op verzoek van gebruiker */}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <TabsList className="p-1 bg-blue-900/10">
            <TabsTrigger value="instructor-schedule" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">Docentenrooster</TabsTrigger>
            <TabsTrigger value="room-allocation" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">Lokalenverdeling</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Zoek planning..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 w-full"
              />
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
        
        <TabsContent value="room-allocation">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Lokalentoewijzing</CardTitle>

              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-5 bg-slate-50 p-3 text-xs font-medium">
                    <div>Lokaal</div>
                    <div>Capaciteit</div>
                    <div>Status</div>
                    <div>Huidig gebruik</div>
                    <div className="text-right">Acties</div>
                  </div>
                  <div className="divide-y">
                    {rooms && rooms.length > 0 ? (
                      rooms.map((room: any) => (
                        <div key={room.id} className="grid grid-cols-5 items-center p-3">
                          <div className="font-medium">{room.name}</div>
                          <div>{room.capacity} personen</div>
                          <div>
                            <Badge className={
                              room.status === 'available' ? "bg-green-100 text-green-800 hover:bg-green-100" :
                              room.status === 'occupied' ? "bg-red-100 text-red-800 hover:bg-red-100" :
                              "bg-amber-100 text-amber-800 hover:bg-amber-100"
                            }>
                              {room.status === 'available' ? 'Beschikbaar' : 
                               room.status === 'occupied' ? 'Bezet' : 'Gereserveerd'}
                            </Badge>
                          </div>
                          <div>{room.currentUse || '-'}</div>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        Geen lokaalgegevens beschikbaar
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="instructor-schedule">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Docentenrooster</CardTitle>
                <div className="flex flex-col gap-3">
                  <Tabs defaultValue="today" className="w-full">
                    <TabsList className="p-1 bg-blue-900/10">
                      <TabsTrigger value="today" className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                        Vandaag
                      </TabsTrigger>
                      <TabsTrigger value="week" className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                        Deze week
                      </TabsTrigger>
                      <TabsTrigger value="month" className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                        Deze maand
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-6 bg-slate-50 p-3 text-xs font-medium">
                    <div>Docent</div>
                    <div>Vak</div>
                    <div>Klas</div>
                    <div>Tijd</div>
                    <div>Lokaal</div>
                    <div className="text-right">Acties</div>
                  </div>
                  <div className="divide-y">
                    {schedules && schedules.length > 0 ? (
                      schedules.map((schedule: any) => (
                        <div key={schedule.id} className="grid grid-cols-6 items-center p-3">
                          <div className="font-medium">{schedule.instructorName}</div>
                          <div>{schedule.courseName}</div>
                          <div>{schedule.className}</div>
                          <div>{schedule.startTime} - {schedule.endTime}</div>
                          <div>{schedule.roomName}</div>
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        Geen docentroosters beschikbaar
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Planning Toevoegen Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[95vw] h-[85vh] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center">
              <PlusCircle className="mr-2 h-5 w-5 text-primary" />
              Planning Toevoegen
            </DialogTitle>
            <DialogDescription>
              Wijs docenten toe aan vakken of ken lokalen toe aan lessen.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit} className="space-y-6 mt-4">
            <Tabs 
              value={dialogActiveTab} 
              onValueChange={setDialogActiveTab} 
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 mb-4 p-1 bg-blue-900/10">
                <TabsTrigger value="instructor-schedule" className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                  <GraduationCap className="mr-2 h-4 w-4 text-primary" />
                  Docentenrooster
                </TabsTrigger>
                <TabsTrigger value="room-allocation" className="flex items-center justify-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                  <Building className="mr-2 h-4 w-4 text-primary" />
                  Lokalenverdeling
                </TabsTrigger>
              </TabsList>
              
              {/* Docenten Rooster Tab Content */}
              <TabsContent value="instructor-schedule" className="space-y-4 mt-2">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium mb-4 border-b pb-2 text-gray-700">
                      <div className="flex items-center">
                        <GraduationCap className="mr-2 h-5 w-5 text-primary" />
                        Docent Toewijzen
                      </div>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="teacherId">Docent</Label>
                        <Select 
                          value={formData.teacherId}
                          onValueChange={(value) => handleFormChange('teacherId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer een docent" />
                          </SelectTrigger>
                          <SelectContent>
                            {instructors.length > 0 ? (
                              instructors.map((teacher: any) => (
                                <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                  {teacher.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="1">Mohammed Youssef</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="courseId">Vak</Label>
                        <Select 
                          value={formData.courseId}
                          onValueChange={(value) => handleFormChange('courseId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer een vak" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.length > 0 ? (
                              courses.map((course: any) => (
                                <SelectItem key={course.id} value={course.id.toString()}>
                                  {course.name}
                                </SelectItem>
                              ))
                            ) : (
                              <>
                                <SelectItem value="1">Arabische Taal</SelectItem>
                                <SelectItem value="2">Fiqh</SelectItem>
                                <SelectItem value="3">Koranwetenschappen</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="classId">Klas</Label>
                        <Select 
                          value={formData.classId}
                          onValueChange={(value) => handleFormChange('classId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer een klas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Klas 1A</SelectItem>
                            <SelectItem value="2">Klas 2B</SelectItem>
                            <SelectItem value="3">Klas 3C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium mb-4 border-b pb-2 text-gray-700">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-5 w-5 text-primary" />
                        Tijdstip
                      </div>
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="mb-2 block">Dagen</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="monday" 
                              checked={formData.selectedDays.monday}
                              onCheckedChange={(checked) => {
                                handleFormChange('selectedDays', {
                                  ...formData.selectedDays,
                                  monday: !!checked
                                });
                              }}
                            />
                            <Label htmlFor="monday" className="font-normal cursor-pointer">Maandag</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="tuesday" 
                              checked={formData.selectedDays.tuesday}
                              onCheckedChange={(checked) => {
                                handleFormChange('selectedDays', {
                                  ...formData.selectedDays,
                                  tuesday: !!checked
                                });
                              }}
                            />
                            <Label htmlFor="tuesday" className="font-normal cursor-pointer">Dinsdag</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="wednesday" 
                              checked={formData.selectedDays.wednesday}
                              onCheckedChange={(checked) => {
                                handleFormChange('selectedDays', {
                                  ...formData.selectedDays,
                                  wednesday: !!checked
                                });
                              }}
                            />
                            <Label htmlFor="wednesday" className="font-normal cursor-pointer">Woensdag</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="thursday" 
                              checked={formData.selectedDays.thursday}
                              onCheckedChange={(checked) => {
                                handleFormChange('selectedDays', {
                                  ...formData.selectedDays,
                                  thursday: !!checked
                                });
                              }}
                            />
                            <Label htmlFor="thursday" className="font-normal cursor-pointer">Donderdag</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="friday" 
                              checked={formData.selectedDays.friday}
                              onCheckedChange={(checked) => {
                                handleFormChange('selectedDays', {
                                  ...formData.selectedDays,
                                  friday: !!checked
                                });
                              }}
                            />
                            <Label htmlFor="friday" className="font-normal cursor-pointer">Vrijdag</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="saturday" 
                              checked={formData.selectedDays.saturday}
                              onCheckedChange={(checked) => {
                                handleFormChange('selectedDays', {
                                  ...formData.selectedDays,
                                  saturday: !!checked
                                });
                              }}
                            />
                            <Label htmlFor="saturday" className="font-normal cursor-pointer">Zaterdag</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="sunday" 
                              checked={formData.selectedDays.sunday}
                              onCheckedChange={(checked) => {
                                handleFormChange('selectedDays', {
                                  ...formData.selectedDays,
                                  sunday: !!checked
                                });
                              }}
                            />
                            <Label htmlFor="sunday" className="font-normal cursor-pointer">Zondag</Label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startTime">Starttijd</Label>
                          <Input 
                            id="startTime"
                            type="time"
                            value={formData.startTime}
                            onChange={(e) => handleFormChange('startTime', e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="endTime">Eindtijd</Label>
                          <Input 
                            id="endTime"
                            type="time"
                            value={formData.endTime}
                            onChange={(e) => handleFormChange('endTime', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-4">
                        <Checkbox 
                          id="repeat"
                          checked={formData.repeat}
                          onCheckedChange={(checked) => handleFormChange('repeat', !!checked)}
                        />
                        <Label htmlFor="repeat" className="font-normal cursor-pointer">
                          Wekelijks herhalen
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Lokalen Toewijzing Tab Content */}
              <TabsContent value="room-allocation" className="space-y-4 mt-2">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium mb-4 border-b pb-2 text-gray-700">
                      <div className="flex items-center">
                        <MapPin className="mr-2 h-5 w-5 text-primary" />
                        Lokaal Toewijzen
                      </div>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="roomName">Lokaal</Label>
                        <Input 
                          id="roomName"
                          type="text"
                          placeholder="Voer lokaalnummer of -naam in"
                          value={formData.roomName}
                          onChange={(e) => handleFormChange('roomName', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="toewijzingsCategorie">Toewijzen aan</Label>
                        <Select 
                          value={formData.toewijzingsCategorie}
                          onValueChange={(value) => handleFormChange('toewijzingsCategorie', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer categorie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vak">Vak</SelectItem>
                            <SelectItem value="klas">Klas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="assignmentId">
                        {formData.toewijzingsCategorie === 'vak' ? 'Vak' : 'Klas'}
                      </Label>
                      <Select 
                        value={formData.assignmentId}
                        onValueChange={(value) => handleFormChange('assignmentId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Selecteer een ${formData.toewijzingsCategorie === 'vak' ? 'vak' : 'klas'}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.toewijzingsCategorie === 'vak' ? (
                            courses.length > 0 ? (
                              courses.map((course: any) => (
                                <SelectItem key={course.id} value={course.id.toString()}>
                                  {course.name}
                                </SelectItem>
                              ))
                            ) : (
                              <>
                                <SelectItem value="1">Arabische Taal</SelectItem>
                                <SelectItem value="2">Fiqh</SelectItem>
                                <SelectItem value="3">Koranwetenschappen</SelectItem>
                              </>
                            )
                          ) : (
                            <>
                              <SelectItem value="1">Klas 1A</SelectItem>
                              <SelectItem value="2">Klas 2B</SelectItem>
                              <SelectItem value="3">Klas 3C</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="description">Opmerkingen (optioneel)</Label>
                      <textarea
                        id="description"
                        className="w-full min-h-[100px] p-2 rounded-md border border-gray-300"
                        value={formData.description}
                        onChange={(e) => handleFormChange('description', e.target.value)}
                        placeholder="Voeg eventuele opmerkingen of instructies toe"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-primary">
                Planning Opslaan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}