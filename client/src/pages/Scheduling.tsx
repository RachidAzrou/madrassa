import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Users, BookOpen, User, Search, Filter, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Shared components
import { 
  StandardTable, 
  StandardTableHeader, 
  StandardTableBody, 
  StandardTableRow, 
  StandardTableCell, 
  StandardTableHeaderCell,
  TableLoadingState,
  TableErrorState,
  TableEmptyState,
  EmptyActionHeader
} from '@/components/ui/standard-table';
import { SearchActionLayout, SearchActionBar, QuickActions } from '@/components/ui/data-table-container';
import { CustomDialog, DialogFormContainer, DialogFooterContainer } from '@/components/ui/custom-dialog';
import { DialogHeaderWithIcon } from '@/components/ui/dialog-header-with-icon';
import { DeleteDialog } from '@/components/ui/delete-dialog';
import { PremiumHeader } from '@/components/layout/premium-header';

// Types
interface ScheduleEntry {
  id: number;
  dayOfWeek: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
  className: string;
  classId: number;
  subjectName: string;
  subjectId: number;
  teacherName: string;
  teacherId: number;
  roomName: string;
  roomId: number;
  type: 'regular' | 'exam' | 'special';
  status: 'active' | 'cancelled' | 'rescheduled';
  notes?: string;
}

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
}

interface Course {
  id: number;
  name: string;
  code: string;
  description?: string;
}

interface ClassGroup {
  id: number;
  name: string;
  academicYear: string;
  programId: number;
}

interface Room {
  id: number;
  name: string;
  capacity: number;
  location: string;
  equipment?: string[];
}

export default function Scheduling() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleEntry | null>(null);

  // Mock data for development
  const mockScheduleData = [
    {
      id: 1,
      dayOfWeek: 'Maandag',
      timeSlot: '08:30 - 10:00',
      startTime: '08:30',
      endTime: '10:00',
      className: '1A',
      classId: 1,
      subjectName: 'Arabisch',
      subjectId: 1,
      teacherName: 'Ahmed Al-Mansouri',
      teacherId: 1,
      roomName: 'Lokaal 101',
      roomId: 1,
      type: 'regular' as const,
      status: 'active' as const,
    },
    {
      id: 2,
      dayOfWeek: 'Maandag',
      timeSlot: '10:15 - 11:45',
      startTime: '10:15',
      endTime: '11:45',
      className: '2B',
      classId: 2,
      subjectName: 'Koran Studies',
      subjectId: 2,
      teacherName: 'Fatima Al-Zahra',
      teacherId: 2,
      roomName: 'Lokaal 203',
      roomId: 2,
      type: 'regular' as const,
      status: 'active' as const,
    },
    {
      id: 3,
      dayOfWeek: 'Dinsdag',
      timeSlot: '09:00 - 10:30',
      startTime: '09:00',
      endTime: '10:30',
      className: '3A',
      classId: 3,
      subjectName: 'Islamitische Geschiedenis',
      subjectId: 3,
      teacherName: 'Omar Benali',
      teacherId: 3,
      roomName: 'Lokaal 105',
      roomId: 3,
      type: 'regular' as const,
      status: 'active' as const,
    },
    {
      id: 4,
      dayOfWeek: 'Woensdag',
      timeSlot: '14:00 - 15:30',
      startTime: '14:00',
      endTime: '15:30',
      className: '1B',
      classId: 4,
      subjectName: 'Fiqh',
      subjectId: 4,
      teacherName: 'Yasmin El-Khouri',
      teacherId: 4,
      roomName: 'Lokaal 201',
      roomId: 4,
      type: 'regular' as const,
      status: 'active' as const,
    },
    {
      id: 5,
      dayOfWeek: 'Donderdag',
      timeSlot: '11:00 - 12:30',
      startTime: '11:00',
      endTime: '12:30',
      className: '2A',
      classId: 5,
      subjectName: 'Hadith Studies',
      subjectId: 5,
      teacherName: 'Ibrahim Al-Qudsi',
      teacherId: 5,
      roomName: 'Lokaal 102',
      roomId: 5,
      type: 'regular' as const,
      status: 'active' as const,
    },
    {
      id: 6,
      dayOfWeek: 'Vrijdag',
      timeSlot: '08:30 - 10:00',
      startTime: '08:30',
      endTime: '10:00',
      className: '3B',
      classId: 6,
      subjectName: 'Tafsir',
      subjectId: 6,
      teacherName: 'Amina Hakim',
      teacherId: 6,
      roomName: 'Lokaal 301',
      roomId: 6,
      type: 'regular' as const,
      status: 'active' as const,
    }
  ];

  // API calls with fallback to mock data
  const { data: scheduleData, isLoading: schedulesLoading, error: schedulesError } = useQuery({
    queryKey: ['/api/schedules'],
    queryFn: () => fetch('/api/schedules').then(res => res.json()),
  });

  const { data: coursesData = {}, isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: () => fetch('/api/courses').then(res => res.json()),
  });

  const { data: teachersData = {}, isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/teachers'],
    queryFn: () => fetch('/api/teachers').then(res => res.json()),
  });

  const { data: roomsData = {}, isLoading: roomsLoading } = useQuery({
    queryKey: ['/api/rooms'],
    queryFn: () => fetch('/api/rooms').then(res => res.json()),
  });

  // Use mock data as primary source for demo purposes
  const schedules = mockScheduleData;
  const courses = coursesData?.courses || [];
  const teachers = teachersData?.teachers || [];
  const rooms = roomsData?.rooms || [];

  // Get unique values for filters
  const uniqueClasses = Array.from(new Set(schedules.map((s: ScheduleEntry) => s.className)));
  const uniqueTeachers = Array.from(new Set(schedules.map((s: ScheduleEntry) => s.teacherName)));
  const uniqueSubjects = Array.from(new Set(schedules.map((s: ScheduleEntry) => s.subjectName)));
  const uniqueDays = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'];

  // Filter schedules based on search and filter criteria
  const filteredSchedules = schedules.filter((schedule: ScheduleEntry) => {
    const matchesSearch = 
      schedule.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.roomName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = !selectedClass || selectedClass === 'all' || schedule.className === selectedClass;
    const matchesTeacher = !selectedTeacher || selectedTeacher === 'all' || schedule.teacherName === selectedTeacher;
    const matchesSubject = !selectedSubject || selectedSubject === 'all' || schedule.subjectName === selectedSubject;
    const matchesDay = !selectedDay || selectedDay === 'all' || schedule.dayOfWeek === selectedDay;

    return matchesSearch && matchesClass && matchesTeacher && matchesSubject && matchesDay;
  });

  // Day colors for visual distinction
  const getDayColor = (day: string) => {
    const colors = {
      'Maandag': 'bg-blue-50 text-blue-700',
      'Dinsdag': 'bg-green-50 text-green-700',
      'Woensdag': 'bg-yellow-50 text-yellow-700',
      'Donderdag': 'bg-purple-50 text-purple-700',
      'Vrijdag': 'bg-red-50 text-red-700',
    };
    return colors[day as keyof typeof colors] || 'bg-gray-50 text-gray-700';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Actief</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Geannuleerd</Badge>;
      case 'rescheduled':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Verplaatst</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewSchedule = (schedule: ScheduleEntry) => {
    setSelectedSchedule(schedule);
    setIsViewDialogOpen(true);
  };

  const handleEditSchedule = (schedule: ScheduleEntry) => {
    setSelectedSchedule(schedule);
    setIsEditDialogOpen(true);
  };

  const handleDeleteSchedule = (schedule: ScheduleEntry) => {
    setSelectedSchedule(schedule);
    setIsDeleteDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedClass('');
    setSelectedTeacher('');
    setSelectedSubject('');
    setSelectedDay('');
  };

  if ((schedulesLoading || coursesLoading || teachersLoading || roomsLoading) && schedules.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PremiumHeader 
          title="Rooster" 
          icon={Calendar} 
          description="Beheer en bekijk het lessenrooster"
          breadcrumbs={{ parent: "Onderwijs", current: "Rooster" }}
        />
        <div className="p-6">
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            <StandardTable>
              <StandardTableHeader>
                <StandardTableRow>
                  <StandardTableHeaderCell>Dag</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Tijdslot</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Klas</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Vak</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Docent</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Lokaal</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Status</StandardTableHeaderCell>
                  <EmptyActionHeader />
                </StandardTableRow>
              </StandardTableHeader>
              <StandardTableBody>
                <TableLoadingState colSpan={8} />
              </StandardTableBody>
            </StandardTable>
          </div>
        </div>
      </div>
    );
  }

  if (schedulesError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PremiumHeader 
          title="Rooster" 
          icon={Calendar} 
          description="Beheer en bekijk het lessenrooster"
          breadcrumbs={{ parent: "Onderwijs", current: "Rooster" }}
        />
        <div className="p-6">
          <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
            <StandardTable>
              <StandardTableHeader>
                <StandardTableRow>
                  <StandardTableHeaderCell>Dag</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Tijdslot</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Klas</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Vak</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Docent</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Lokaal</StandardTableHeaderCell>
                  <StandardTableHeaderCell>Status</StandardTableHeaderCell>
                  <EmptyActionHeader />
                </StandardTableRow>
              </StandardTableHeader>
              <StandardTableBody>
                <TableErrorState colSpan={8} message="Er ging iets mis bij het laden van het rooster." />
              </StandardTableBody>
            </StandardTable>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PremiumHeader 
        title="Rooster" 
        icon={Calendar} 
        description="Beheer en bekijk het lessenrooster voor alle klassen en docenten"
        breadcrumbs={{ parent: "Onderwijs", current: "Rooster" }}
      />

      <div className="p-6 space-y-6">
        {/* Search and Action Bar */}
        <SearchActionBar>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Zoek op klas, vak, docent of lokaal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Les Toevoegen
            </Button>
          </div>
        </SearchActionBar>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </h3>
            {(selectedClass || selectedTeacher || selectedSubject || selectedDay) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Filters wissen
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Alle klassen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle klassen</SelectItem>
                {uniqueClasses.map((className) => (
                  <SelectItem key={className} value={className}>
                    {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Alle docenten" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle docenten</SelectItem>
                {uniqueTeachers.map((teacherName) => (
                  <SelectItem key={teacherName} value={teacherName}>
                    {teacherName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Alle vakken" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle vakken</SelectItem>
                {uniqueSubjects.map((subjectName) => (
                  <SelectItem key={subjectName} value={subjectName}>
                    {subjectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Alle dagen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle dagen</SelectItem>
                {uniqueDays.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
          <StandardTable>
            <StandardTableHeader>
              <StandardTableRow>
                <StandardTableHeaderCell>Dag</StandardTableHeaderCell>
                <StandardTableHeaderCell>Tijdslot</StandardTableHeaderCell>
                <StandardTableHeaderCell>Klas</StandardTableHeaderCell>
                <StandardTableHeaderCell>Vak</StandardTableHeaderCell>
                <StandardTableHeaderCell>Docent</StandardTableHeaderCell>
                <StandardTableHeaderCell>Lokaal</StandardTableHeaderCell>
                <StandardTableHeaderCell>Status</StandardTableHeaderCell>
                <EmptyActionHeader />
              </StandardTableRow>
            </StandardTableHeader>
            <StandardTableBody>
              {filteredSchedules.length === 0 ? (
                <StandardTableRow>
                  <StandardTableCell colSpan={8}>
                    <TableEmptyState 
                      colSpan={8}
                      title="Geen lessen gevonden"
                      description="Er zijn geen lessen die voldoen aan de geselecteerde filters."
                    />
                  </StandardTableCell>
                </StandardTableRow>
              ) : (
                filteredSchedules.map((schedule: ScheduleEntry) => (
                  <StandardTableRow key={schedule.id}>
                    <StandardTableCell>
                      <Badge variant="outline" className={getDayColor(schedule.dayOfWeek)}>
                        {schedule.dayOfWeek}
                      </Badge>
                    </StandardTableCell>
                    <StandardTableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-gray-400" />
                        {schedule.timeSlot}
                      </div>
                    </StandardTableCell>
                    <StandardTableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span className="font-medium">{schedule.className}</span>
                      </div>
                    </StandardTableCell>
                    <StandardTableCell>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3 text-gray-400" />
                        {schedule.subjectName}
                      </div>
                    </StandardTableCell>
                    <StandardTableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-gray-400" />
                        {schedule.teacherName}
                      </div>
                    </StandardTableCell>
                    <StandardTableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {schedule.roomName}
                      </div>
                    </StandardTableCell>
                    <StandardTableCell>
                      {getStatusBadge(schedule.status)}
                    </StandardTableCell>
                    <StandardTableCell>
                      <QuickActions
                        onView={() => handleViewSchedule(schedule)}
                        onEdit={() => handleEditSchedule(schedule)}
                        onDelete={() => handleDeleteSchedule(schedule)}
                      />
                    </StandardTableCell>
                  </StandardTableRow>
                ))
              )}
            </StandardTableBody>
          </StandardTable>
        </div>
      </div>

      {/* Delete Dialog */}
      {selectedSchedule && (
        <DeleteDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={() => {
            // TODO: Implement delete functionality
            setIsDeleteDialogOpen(false);
            toast({
              title: "Les verwijderd",
              description: "De les is succesvol verwijderd uit het rooster.",
            });
          }}
          title="Les verwijderen"
          description={`Weet je zeker dat je de les ${selectedSchedule.subjectName} voor klas ${selectedSchedule.className} op ${selectedSchedule.dayOfWeek} om ${selectedSchedule.startTime} wilt verwijderen?`}
        />
      )}
    </div>
  );
}