import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, 
  Calendar, Clock, Users, Repeat, Landmark, GraduationCap, 
  Building, BookOpen, ChevronRight, MapPin, Check, X,
  AlertCircle, Calendar as CalendarIcon, XCircle, ChevronDown, ChevronUp
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
import { Textarea } from "@/components/ui/textarea";
import { PremiumHeader } from '@/components/layout/premium-header';

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
  type: 'regular' | 'once';
  date?: string; // Voor eenmalige lessen
  notes?: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  courses: string[];
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface ClassGroup {
  id: number;
  name: string;
  academicYear: string;
  programId: number;
  programName: string;
}

interface Room {
  id: number;
  name: string;
  capacity: number;
  location: string;
}

export default function Scheduling() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<TeacherSchedule | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  
  const [formData, setFormData] = useState<Partial<TeacherSchedule>>({
    teacherId: '',
    courseId: 0,
    classId: 0,
    startTime: '09:00',
    endTime: '10:30',
    dayOfWeek: 'monday',
    roomId: 0,
    type: 'regular',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  // Data fetching
  const { data: scheduleData = { schedules: [] }, isLoading: isLoadingSchedules } = useQuery({
    queryKey: ['/api/schedules', { teacher: selectedTeacher, class: selectedClass, day: selectedDay }],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (selectedTeacher !== 'all') params.append('teacherId', selectedTeacher);
        if (selectedClass !== 'all') params.append('classId', selectedClass);
        if (selectedDay !== 'all') params.append('dayOfWeek', selectedDay);
        
        const response = await apiRequest(`/api/schedules?${params.toString()}`);
        return response;
      } catch (error) {
        console.error('Error fetching schedule data:', error);
        return { schedules: [] };
      }
    }
  });

  const { data: teachersData = { teachers: [] } } = useQuery({
    queryKey: ['/api/teachers'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/teachers');
        return response;
      } catch (error) {
        console.error('Error fetching teachers:', error);
        return { teachers: [] };
      }
    }
  });

  const { data: coursesData = { courses: [] } } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/courses');
        return response;
      } catch (error) {
        console.error('Error fetching courses:', error);
        return { courses: [] };
      }
    }
  });

  const { data: classGroupsData = { groups: [] } } = useQuery({
    queryKey: ['/api/student-groups'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/student-groups');
        return response;
      } catch (error) {
        console.error('Error fetching class groups:', error);
        return { groups: [] };
      }
    }
  });

  const { data: roomsData = { rooms: [] } } = useQuery({
    queryKey: ['/api/rooms'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/rooms');
        return response;
      } catch (error) {
        console.error('Error fetching rooms:', error);
        return { rooms: [] };
      }
    }
  });

  // Toon alleen de planning voor de geselecteerde docent/klas/dag
  const filteredSchedules = scheduleData?.schedules?.filter((schedule: TeacherSchedule) => {
    // Alleen filteren op zoekterm als die is ingevuld
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        schedule.instructorName.toLowerCase().includes(searchLower) ||
        schedule.courseName.toLowerCase().includes(searchLower) ||
        schedule.className.toLowerCase().includes(searchLower) ||
        schedule.roomName.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  // Groepeer lessen per dag voor weergave
  const groupedSchedules = filteredSchedules && filteredSchedules.length > 0 ? 
    filteredSchedules.reduce((acc: any, schedule: TeacherSchedule) => {
      const day = schedule.dayOfWeek;
      if (!acc[day]) acc[day] = [];
      acc[day].push(schedule);
      return acc;
    }, {}) : {};
  
  // Sorteer de lessen per tijdstip
  if (Object.keys(groupedSchedules).length > 0) {
    Object.keys(groupedSchedules).forEach(day => {
      if (groupedSchedules[day] && Array.isArray(groupedSchedules[day])) {
        groupedSchedules[day].sort((a: TeacherSchedule, b: TeacherSchedule) => 
          a.startTime.localeCompare(b.startTime)
        );
      }
    });
  }

  // Dagen van de week voor de tabs
  const daysOfWeek = [
    { value: 'all', label: 'Alle dagen' },
    { value: 'monday', label: 'Maandag' },
    { value: 'tuesday', label: 'Dinsdag' },
    { value: 'wednesday', label: 'Woensdag' },
    { value: 'thursday', label: 'Donderdag' },
    { value: 'friday', label: 'Vrijdag' }
  ];

  // Mutations
  const createScheduleMutation = useMutation({
    mutationFn: async (scheduleData: Partial<TeacherSchedule>) => {
      const response = await apiRequest('/api/schedules', {
        method: 'POST',
        body: scheduleData
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Lesuur toegevoegd",
        description: "Het lesuur is succesvol toegevoegd aan het rooster.",
      });
      setShowDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van het lesuur.",
        variant: "destructive",
      });
    }
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<TeacherSchedule> }) => {
      const response = await apiRequest(`/api/schedules/${id}`, {
        method: 'PATCH',
        body: data
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Lesuur bijgewerkt",
        description: "Het lesuur is succesvol bijgewerkt.",
      });
      setShowDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van het lesuur.",
        variant: "destructive",
      });
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/schedules/${id}`, {
        method: 'DELETE'
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Lesuur verwijderd",
        description: "Het lesuur is succesvol verwijderd uit het rooster.",
      });
      setShowConfirmDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van het lesuur.",
        variant: "destructive",
      });
    }
  });

  // Event handlers
  const handleAddSchedule = () => {
    setFormData({
      teacherId: '',
      courseId: 0,
      classId: 0,
      startTime: '09:00',
      endTime: '10:30',
      dayOfWeek: 'monday',
      roomId: 0,
      type: 'regular',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setEditMode(false);
    setShowDialog(true);
  };

  const handleEditSchedule = (schedule: TeacherSchedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      teacherId: schedule.teacherId,
      courseId: schedule.courseId,
      classId: schedule.classId,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      dayOfWeek: schedule.dayOfWeek,
      roomId: schedule.roomId,
      type: schedule.type,
      date: schedule.date,
      notes: schedule.notes
    });
    setEditMode(true);
    setShowDialog(true);
  };

  const handleDeleteSchedule = (schedule: TeacherSchedule) => {
    setSelectedSchedule(schedule);
    setShowConfirmDialog(true);
  };

  const confirmDeleteSchedule = () => {
    if (selectedSchedule) {
      deleteScheduleMutation.mutate(selectedSchedule.id);
    }
  };

  const handleFormChange = (field: keyof TeacherSchedule, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validatie
    if (!formData.teacherId || !formData.courseId || !formData.classId || !formData.roomId) {
      toast({
        title: "Vul alle verplichte velden in",
        description: "Docent, vak, klas en lokaal zijn verplicht.",
        variant: "destructive",
      });
      return;
    }
    
    if (editMode && selectedSchedule) {
      updateScheduleMutation.mutate({ 
        id: selectedSchedule.id, 
        data: formData
      });
    } else {
      createScheduleMutation.mutate(formData);
    }
  };

  const getDayLabel = (day: string) => {
    const dayMap: {[key: string]: string} = {
      'monday': 'Maandag',
      'tuesday': 'Dinsdag',
      'wednesday': 'Woensdag',
      'thursday': 'Donderdag',
      'friday': 'Vrijdag'
    };
    return dayMap[day] || day;
  };
  
  const getTeacherById = (id: string) => {
    const t = teachersData.teachers.find((t: Teacher) => t.id === id);
    const c = coursesData.courses.find((c: Course) => c.id === Number(formData.courseId));
    const g = classGroupsData.groups.find((g: ClassGroup) => g.id === Number(formData.classId));
    const r = roomsData.rooms.find((r: Room) => r.id === Number(formData.roomId));
    
    return {
      teacherName: t ? `${t.firstName} ${t.lastName}` : 'Onbekend',
      courseName: c?.name || 'Onbekend',
      className: g?.name || 'Onbekend',
      roomName: r?.name || 'Onbekend'
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Premium header component */}
      <PremiumHeader 
        title="Planning" 
        path="Evaluatie > Planning" 
        icon={Clock}
        description="Beheer lesroosters, plan lessen voor klassen en docenten, en voorkom planningsconflicten"
      />

      {/* Main content area */}
      <div className="px-6 py-6 flex-1">
        {/* Zoek- en actiebalk - Desktop style */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm mb-4">
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            {/* Zoekbalk */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Zoek op docent, vak, klas of lokaal..."
                className="w-full pl-9 h-8 text-xs rounded-sm bg-white border-[#e5e7eb]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Acties */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterOptions(!showFilterOptions)}
                className="h-7 text-xs rounded-sm border-[#e5e7eb]"
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                Filters
                {showFilterOptions ? 
                  <ChevronUp className="h-3.5 w-3.5 ml-1" /> : 
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                }
              </Button>
              
              <Button
                size="sm"
                onClick={handleAddSchedule}
                className="h-7 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Nieuw Lesuur
              </Button>
            </div>
          </div>
          
          {/* Filter opties */}
          {showFilterOptions && (
            <div className="px-4 py-3 border-t border-[#e5e7eb] flex flex-wrap gap-3 items-center">
              <div className="flex items-center">
                {(selectedTeacher !== 'all' || selectedClass !== 'all' || selectedDay !== 'all') && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setSelectedTeacher('all');
                      setSelectedClass('all');
                      setSelectedDay('all');
                    }}
                    className="h-7 text-xs text-blue-600 p-0 mr-3"
                  >
                    Filters wissen
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Select 
                  value={selectedTeacher} 
                  onValueChange={setSelectedTeacher}
                >
                  <SelectTrigger className="w-40 h-7 text-xs rounded-sm">
                    <SelectValue placeholder="Docent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle docenten</SelectItem>
                    {teachersData?.teachers?.map((teacher: Teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={selectedClass} 
                  onValueChange={setSelectedClass}
                >
                  <SelectTrigger className="w-40 h-7 text-xs rounded-sm">
                    <SelectValue placeholder="Klas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle klassen</SelectItem>
                    {classGroupsData?.groups?.map((group: ClassGroup) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={selectedDay} 
                  onValueChange={setSelectedDay}
                >
                  <SelectTrigger className="w-40 h-7 text-xs rounded-sm">
                    <SelectValue placeholder="Dag" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map(day => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        
        {/* Dagtabs */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm mb-4">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="bg-[#f9fafc] border-b border-[#e5e7eb] w-full flex h-10 items-center justify-start overflow-x-auto rounded-none px-0 scrollbar-hide">
              {daysOfWeek.map(day => (
                <TabsTrigger 
                  key={day.value} 
                  value={day.value}
                  className="flex h-10 border-b-2 border-transparent data-[state=active]:border-[#1e40af] rounded-none px-4 py-2 text-xs font-medium text-gray-500 data-[state=active]:text-[#1e40af] bg-transparent"
                >
                  {day.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {daysOfWeek.map(day => (
              <TabsContent key={day.value} value={day.value} className="p-0">
                {isLoadingSchedules ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-6 h-6 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-sm text-gray-500">Laden...</span>
                  </div>
                ) : (
                  <div className="divide-y divide-[#e5e7eb]">
                    {day.value === 'all' ? (
                      // Alle dagen weergeven
                      Object.keys(groupedSchedules).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                          <Calendar className="h-12 w-12 text-gray-300 mb-2" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">Geen lessen gepland</h3>
                          <p className="text-sm text-center max-w-md mb-4">
                            {searchTerm || selectedTeacher !== 'all' || selectedClass !== 'all' 
                              ? 'Er zijn geen lesuren die voldoen aan de huidige filters.' 
                              : 'Er zijn nog geen lesuren ingepland.'}
                          </p>
                          <Button
                            size="sm"
                            onClick={handleAddSchedule}
                            className="h-8 text-xs rounded-sm bg-[#1e40af]"
                          >
                            <PlusCircle className="h-3.5 w-3.5 mr-1" />
                            Lesuur toevoegen
                          </Button>
                        </div>
                      ) : (
                        Object.keys(groupedSchedules).map(dayKey => (
                          <div key={dayKey} className="py-4">
                            <h3 className="px-4 font-medium text-sm text-gray-700 mb-3">
                              {getDayLabel(dayKey)}
                            </h3>
                            
                            <div className="space-y-3 px-4">
                              {groupedSchedules[dayKey].map((schedule: TeacherSchedule) => (
                                <div 
                                  key={schedule.id} 
                                  className="border border-[#e5e7eb] rounded-sm hover:bg-gray-50"
                                >
                                  <div className="p-3 flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                      <div className="bg-[#f9fafc] border border-[#e5e7eb] rounded-sm p-1.5 text-center min-w-[60px]">
                                        <div className="text-xs text-gray-700">{schedule.startTime}</div>
                                        <div className="text-xs text-gray-500">{schedule.endTime}</div>
                                      </div>
                                      
                                      <div>
                                        <div className="font-medium text-sm">{schedule.courseName}</div>
                                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                                          <div className="flex items-center">
                                            <GraduationCap className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                            <span>{schedule.instructorName}</span>
                                          </div>
                                          <div className="flex items-center">
                                            <Users className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                            <span>{schedule.className}</span>
                                          </div>
                                          <div className="flex items-center">
                                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                            <span>{schedule.roomName}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditSchedule(schedule)}
                                        className="h-7 w-7 p-0 text-gray-500"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteSchedule(schedule)}
                                        className="h-7 w-7 p-0 text-gray-500"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {schedule.notes && (
                                    <div className="px-3 py-2 border-t border-[#e5e7eb] text-xs text-gray-600 bg-gray-50">
                                      <div className="flex items-start">
                                        <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-gray-400 mt-0.5" />
                                        <span>{schedule.notes}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )
                    ) : (
                      // Specifieke dag weergeven
                      groupedSchedules[day.value] ? (
                        <div className="py-4">
                          <div className="space-y-3 px-4">
                            {groupedSchedules[day.value].map((schedule: TeacherSchedule) => (
                              <div 
                                key={schedule.id} 
                                className="border border-[#e5e7eb] rounded-sm hover:bg-gray-50"
                              >
                                <div className="p-3 flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <div className="bg-[#f9fafc] border border-[#e5e7eb] rounded-sm p-1.5 text-center min-w-[60px]">
                                      <div className="text-xs text-gray-700">{schedule.startTime}</div>
                                      <div className="text-xs text-gray-500">{schedule.endTime}</div>
                                    </div>
                                    
                                    <div>
                                      <div className="font-medium text-sm">{schedule.courseName}</div>
                                      <div className="text-xs text-gray-500 mt-1 space-y-1">
                                        <div className="flex items-center">
                                          <GraduationCap className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                          <span>{schedule.instructorName}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <Users className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                          <span>{schedule.className}</span>
                                        </div>
                                        <div className="flex items-center">
                                          <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                          <span>{schedule.roomName}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-start gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditSchedule(schedule)}
                                      className="h-7 w-7 p-0 text-gray-500"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteSchedule(schedule)}
                                      className="h-7 w-7 p-0 text-gray-500"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {schedule.notes && (
                                  <div className="px-3 py-2 border-t border-[#e5e7eb] text-xs text-gray-600 bg-gray-50">
                                    <div className="flex items-start">
                                      <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-gray-400 mt-0.5" />
                                      <span>{schedule.notes}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                          <Calendar className="h-12 w-12 text-gray-300 mb-2" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">Geen lessen gepland</h3>
                          <p className="text-sm text-center max-w-md mb-4">
                            {searchTerm || selectedTeacher !== 'all' || selectedClass !== 'all' 
                              ? `Er zijn geen lesuren die voldoen aan de huidige filters voor ${day.label.toLowerCase()}.` 
                              : `Er zijn nog geen lesuren ingepland voor ${day.label.toLowerCase()}.`}
                          </p>
                          <Button
                            size="sm"
                            onClick={handleAddSchedule}
                            className="h-8 text-xs rounded-sm bg-[#1e40af]"
                          >
                            <PlusCircle className="h-3.5 w-3.5 mr-1" />
                            Lesuur toevoegen
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Dialogen */}
      
      {/* Lesuur toevoegen/bewerken dialoog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editMode ? "Lesuur bewerken" : "Lesuur toevoegen"}</DialogTitle>
            <DialogDescription>
              {editMode 
                ? "Werk de details van dit lesuur bij." 
                : "Vul de gegevens in om een nieuw lesuur toe te voegen aan het rooster."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="teacherId" className="text-xs">Docent</Label>
                <Select 
                  value={formData.teacherId?.toString() || ""} 
                  onValueChange={(value) => handleFormChange('teacherId', value)}
                >
                  <SelectTrigger id="teacherId" className="h-8 text-xs">
                    <SelectValue placeholder="Selecteer docent" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachersData.teachers.map((teacher: Teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="courseId" className="text-xs">Vak</Label>
                <Select 
                  value={formData.courseId?.toString() || ""} 
                  onValueChange={(value) => handleFormChange('courseId', parseInt(value))}
                >
                  <SelectTrigger id="courseId" className="h-8 text-xs">
                    <SelectValue placeholder="Selecteer vak" />
                  </SelectTrigger>
                  <SelectContent>
                    {coursesData.courses.map((course: Course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="classId" className="text-xs">Klas</Label>
                <Select 
                  value={formData.classId?.toString() || ""} 
                  onValueChange={(value) => handleFormChange('classId', parseInt(value))}
                >
                  <SelectTrigger id="classId" className="h-8 text-xs">
                    <SelectValue placeholder="Selecteer klas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classGroupsData?.groups?.map((group: ClassGroup) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roomId" className="text-xs">Lokaal</Label>
                <Select 
                  value={formData.roomId?.toString() || ""} 
                  onValueChange={(value) => handleFormChange('roomId', parseInt(value))}
                >
                  <SelectTrigger id="roomId" className="h-8 text-xs">
                    <SelectValue placeholder="Selecteer lokaal" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomsData.rooms.map((room: Room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.name} ({room.location})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek" className="text-xs">Dag</Label>
                <Select 
                  value={formData.dayOfWeek || "monday"} 
                  onValueChange={(value) => handleFormChange('dayOfWeek', value)}
                >
                  <SelectTrigger id="dayOfWeek" className="h-8 text-xs">
                    <SelectValue placeholder="Selecteer dag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Maandag</SelectItem>
                    <SelectItem value="tuesday">Dinsdag</SelectItem>
                    <SelectItem value="wednesday">Woensdag</SelectItem>
                    <SelectItem value="thursday">Donderdag</SelectItem>
                    <SelectItem value="friday">Vrijdag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type" className="text-xs">Type</Label>
                <Select 
                  value={formData.type || "regular"} 
                  onValueChange={(value) => handleFormChange('type', value as 'regular' | 'once')}
                >
                  <SelectTrigger id="type" className="h-8 text-xs">
                    <SelectValue placeholder="Selecteer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regulier (wekelijks)</SelectItem>
                    <SelectItem value="once">Eenmalig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-xs">Starttijd</Label>
                <Input 
                  id="startTime"
                  type="time"
                  value={formData.startTime || '09:00'}
                  onChange={(e) => handleFormChange('startTime', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-xs">Eindtijd</Label>
                <Input 
                  id="endTime"
                  type="time"
                  value={formData.endTime || '10:30'}
                  onChange={(e) => handleFormChange('endTime', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              
              {formData.type === 'once' && (
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-xs">Datum (eenmalig)</Label>
                  <Input 
                    id="date"
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => handleFormChange('date', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              )}
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes" className="text-xs">Notities</Label>
                <Textarea 
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Eventuele opmerkingen over deze les..."
                  className="min-h-[80px] text-xs"
                />
              </div>
              
              {formData.teacherId && formData.courseId && formData.classId && formData.roomId && (
                <div className="col-span-2 p-3 bg-[#f9fafc] border border-[#e5e7eb] rounded-sm">
                  <div className="text-xs font-medium text-gray-700 mb-2">Samenvatting:</div>
                  <div className="text-xs text-gray-600">
                    {(() => {
                      const info = getTeacherById(formData.teacherId);
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <GraduationCap className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            <span>{info.teacherName}</span>
                          </div>
                          <div className="flex items-center">
                            <BookOpen className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            <span>{info.courseName}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            <span>{info.className}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            <span>{info.roomName}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            <span>
                              {formData.type === 'once' 
                                ? `Eenmalig op ${formData.date ? new Date(formData.date).toLocaleDateString('nl-NL') : '...'}`
                                : `Wekelijks op ${getDayLabel(formData.dayOfWeek || 'monday')}`}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            <span>{formData.startTime} - {formData.endTime}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="h-8 text-xs rounded-sm"
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
              >
                {editMode ? "Bijwerken" : "Toevoegen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bevestiging dialoog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Lesuur verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je dit lesuur wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSchedule && (
            <div className="py-4">
              <div className="bg-[#f9fafc] border rounded-sm p-4">
                <div className="mb-2 font-medium text-sm">{selectedSchedule.courseName}</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center">
                    <GraduationCap className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                    <span>{selectedSchedule.instructorName}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                    <span>{selectedSchedule.className}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                    <span>{getDayLabel(selectedSchedule.dayOfWeek)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                    <span>{selectedSchedule.startTime} - {selectedSchedule.endTime}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="h-8 text-xs rounded-sm"
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSchedule}
              className="h-8 text-xs rounded-sm"
            >
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}