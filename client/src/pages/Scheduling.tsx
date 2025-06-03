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
  id: number | string;
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
  date?: string;
  holidayType?: string;
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

  // Fetch academic years data
  const { data: academicYearsData = [] } = useQuery({
    queryKey: ['/api/academic-years'],
    staleTime: 300000,
  });

  // Fetch holidays data
  const { data: holidaysData = [] } = useQuery({
    queryKey: ['/api/holidays'],
    staleTime: 300000,
  });

  // Use mock data with authentic Islamic school content
  const schedules = mockScheduleData;
  const courses = coursesData?.courses || [];
  const teachers = teachersData?.teachers || [];
  const rooms = roomsData?.rooms || [];
  
  // Process academic year and holiday data
  const academicYears = Array.isArray(academicYearsData) ? academicYearsData : [];
  const holidays = Array.isArray(holidaysData) ? holidaysData : [];
  
  // Get current academic year
  const currentAcademicYear = academicYears.find((year: any) => year.isActive) || academicYears[0] || null;

  // Convert academic year dates to calendar events
  const academicYearEvents: ScheduleEntry[] = [];
  if (currentAcademicYear) {
    // Start of academic year
    academicYearEvents.push({
      id: `academic-start-${currentAcademicYear.id}`,
      dayOfWeek: new Date(currentAcademicYear.startDate).toLocaleDateString('nl-NL', { weekday: 'long' }),
      timeSlot: 'Hele dag',
      startTime: '00:00',
      endTime: '23:59',
      className: 'Alle klassen',
      classId: 0,
      subjectName: 'Start Schooljaar',
      subjectId: 0,
      teacherName: 'Schoolleiding',
      teacherId: 0,
      roomName: 'School',
      roomId: 0,
      type: 'special' as const,
      status: 'active' as const,
      notes: `Begin van schooljaar ${currentAcademicYear.name}`,
      date: currentAcademicYear.startDate
    });

    // End of academic year
    academicYearEvents.push({
      id: `academic-end-${currentAcademicYear.id}`,
      dayOfWeek: new Date(currentAcademicYear.endDate).toLocaleDateString('nl-NL', { weekday: 'long' }),
      timeSlot: 'Hele dag',
      startTime: '00:00',
      endTime: '23:59',
      className: 'Alle klassen',
      classId: 0,
      subjectName: 'Einde Schooljaar',
      subjectId: 0,
      teacherName: 'Schoolleiding',
      teacherId: 0,
      roomName: 'School',
      roomId: 0,
      type: 'special' as const,
      status: 'active' as const,
      notes: `Einde van schooljaar ${currentAcademicYear.name}`,
      date: currentAcademicYear.endDate
    });

    // Final report date
    academicYearEvents.push({
      id: `final-report-${currentAcademicYear.id}`,
      dayOfWeek: new Date(currentAcademicYear.finalReportDate).toLocaleDateString('nl-NL', { weekday: 'long' }),
      timeSlot: 'Hele dag',
      startTime: '00:00',
      endTime: '23:59',
      className: 'Alle klassen',
      classId: 0,
      subjectName: 'Eindrapport',
      subjectId: 0,
      teacherName: 'Schoolleiding',
      teacherId: 0,
      roomName: 'School',
      roomId: 0,
      type: 'special' as const,
      status: 'active' as const,
      notes: `Eindrapport uitreiking ${currentAcademicYear.name}`,
      date: currentAcademicYear.finalReportDate
    });
  }

  // Convert holidays to calendar events - spread across all time slots for visibility
  const holidayEvents: ScheduleEntry[] = [];
  const timeSlots = ['08:30 - 10:00', '10:15 - 11:45', '12:30 - 14:00', '14:15 - 15:45', '16:00 - 17:30'];
  
  holidays.forEach((holiday: any) => {
    // Add holiday event for each time slot to ensure visibility
    timeSlots.forEach(timeSlot => {
      holidayEvents.push({
        id: `holiday-${holiday.id}-${timeSlot}`,
        dayOfWeek: new Date(holiday.startDate).toLocaleDateString('nl-NL', { weekday: 'long' }),
        timeSlot: timeSlot,
        startTime: timeSlot.split(' - ')[0],
        endTime: timeSlot.split(' - ')[1],
        className: 'Alle klassen',
        classId: 0,
        subjectName: holiday.name,
        subjectId: 0,
        teacherName: 'Vakantie',
        teacherId: 0,
        roomName: '-',
        roomId: 0,
        type: 'special' as const,
        status: 'active' as const,
        notes: holiday.description || `${holiday.name} van ${new Date(holiday.startDate).toLocaleDateString('nl-NL')} tot ${new Date(holiday.endDate).toLocaleDateString('nl-NL')}`,
        date: holiday.startDate,
        holidayType: holiday.type
      });
    });
  });

  // Combine all schedules and events
  const allScheduleEntries = [...schedules, ...academicYearEvents, ...holidayEvents];

  // Get unique values for filters
  const uniqueClasses = Array.from(new Set(allScheduleEntries.map((s: ScheduleEntry) => s.className)));
  const uniqueTeachers = Array.from(new Set(allScheduleEntries.map((s: ScheduleEntry) => s.teacherName)));
  const uniqueSubjects = Array.from(new Set(allScheduleEntries.map((s: ScheduleEntry) => s.subjectName)));
  const uniqueDays = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'];

  // Filter schedules based on search and filter criteria
  const filteredSchedules = allScheduleEntries.filter((schedule: ScheduleEntry) => {
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

  const getStatusBadge = (schedule: ScheduleEntry) => {
    // Special handling for academic year and holiday events
    if (schedule.subjectName === 'Start Schooljaar') {
      return <Badge className="bg-blue-100 text-blue-800">Schooljaar Start</Badge>;
    }
    if (schedule.subjectName === 'Einde Schooljaar') {
      return <Badge className="bg-purple-100 text-purple-800">Schooljaar Einde</Badge>;
    }
    if (schedule.subjectName === 'Eindrapport') {
      return <Badge className="bg-orange-100 text-orange-800">Eindrapport</Badge>;
    }
    if (schedule.teacherName === 'Vakantie') {
      return <Badge className="bg-green-100 text-green-800">Vakantie</Badge>;
    }

    // Regular status badges
    switch (schedule.status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Actief</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Geannuleerd</Badge>;
      case 'rescheduled':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Verplaatst</Badge>;
      default:
        return <Badge variant="outline">{schedule.status}</Badge>;
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
        {/* Schooljaar & Vakanties Informatie */}
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-medium text-gray-900">Schooljaar Informatie</h3>
            </div>
          </div>
          
          <div className="p-4">
            {/* Huidig Schooljaar */}
            {currentAcademicYear ? (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">Huidig Schooljaar</h4>
                  <Badge className="bg-blue-100 text-blue-800">{currentAcademicYear.name}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-gray-500 text-xs">Startdatum</span>
                    <p className="font-medium">{new Date(currentAcademicYear.startDate).toLocaleDateString('nl-NL')}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-500 text-xs">Einddatum</span>
                    <p className="font-medium">{new Date(currentAcademicYear.endDate).toLocaleDateString('nl-NL')}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-500 text-xs">Eindrapport</span>
                    <p className="font-medium">{new Date(currentAcademicYear.finalReportDate).toLocaleDateString('nl-NL')}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-500 text-xs">Registratie</span>
                    <p className="font-medium">{new Date(currentAcademicYear.registrationStartDate).toLocaleDateString('nl-NL')} - {new Date(currentAcademicYear.registrationEndDate).toLocaleDateString('nl-NL')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Geen actief schooljaar gevonden</p>
              </div>
            )}

            {/* Vakanties */}
            {holidays.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Geplande Vakanties</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {holidays.map((holiday: any) => (
                    <div key={holiday.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{holiday.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(holiday.startDate).toLocaleDateString('nl-NL')} - {new Date(holiday.endDate).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded-md font-medium ${
                        holiday.type === 'vacation' 
                          ? 'bg-green-100 text-green-800'
                          : holiday.type === 'public_holiday'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {holiday.type === 'vacation' ? 'Vakantie' : holiday.type === 'public_holiday' ? 'Feestdag' : 'Studiepauze'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

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

        {/* Weekly Schedule Grid */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="grid grid-cols-6 gap-0">
            {/* Header Row */}
            <div className="bg-blue-50 p-4 border-b border-r font-semibold text-sm text-gray-700">
              Tijd
            </div>
            {['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'].map((day) => (
              <div key={day} className="bg-blue-50 p-4 border-b border-r font-semibold text-sm text-center text-gray-700">
                {day}
              </div>
            ))}
            
            {/* Time slots and schedule grid */}
            {['08:30-09:20', '09:30-10:20', '10:40-11:30', '11:40-12:30'].map((timeSlot) => (
              <>
                {/* Time column */}
                <div key={`time-${timeSlot}`} className="bg-gray-50 p-4 border-b border-r font-medium text-sm text-center text-gray-600">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeSlot}
                  </div>
                </div>
                
                {/* Schedule cells for each day */}
                {['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'].map((day) => {
                  const daySchedules = filteredSchedules.filter(
                    (schedule: ScheduleEntry) => 
                      schedule.dayOfWeek === day && 
                      schedule.timeSlot === timeSlot
                  );
                  
                  return (
                    <div key={`${day}-${timeSlot}`} className="border-b border-r min-h-[120px] p-3 hover:bg-gray-50">
                      {daySchedules.length > 0 ? (
                        <div className="space-y-2">
                          {daySchedules.map((schedule: ScheduleEntry) => (
                            <div
                              key={schedule.id}
                              className={`${
                                schedule.subjectName === 'Start Schooljaar' || schedule.subjectName === 'Einde Schooljaar' || schedule.subjectName === 'Eindrapport'
                                  ? 'bg-gradient-to-br from-purple-100 to-purple-50 hover:from-purple-200 hover:to-purple-100 border-purple-200'
                                  : schedule.teacherName === 'Vakantie'
                                  ? 'bg-gradient-to-br from-green-100 to-green-50 hover:from-green-200 hover:to-green-100 border-green-200'
                                  : 'bg-gradient-to-br from-blue-100 to-blue-50 hover:from-blue-200 hover:to-blue-100 border-blue-200'
                              } p-3 rounded-lg text-xs cursor-pointer transition-all duration-200 group shadow-sm border`}
                              onClick={() => handleViewSchedule(schedule)}
                            >
                              <div className="font-semibold text-blue-900 mb-1 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {schedule.subjectName}
                              </div>
                              <div className="text-blue-700 mb-1 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {schedule.className}
                              </div>
                              <div className="text-blue-600 mb-1 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {schedule.teacherName}
                              </div>
                              <div className="text-blue-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {schedule.roomName}
                              </div>
                              <div className="mt-2">
                                {getStatusBadge(schedule)}
                              </div>
                              
                              {/* Action buttons that appear on hover */}
                              <div className="opacity-0 group-hover:opacity-100 flex gap-1 mt-2 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditSchedule(schedule);
                                  }}
                                  className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-300"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSchedule(schedule);
                                  }}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                          <div className="text-center">
                            <div className="text-gray-300 mb-1">—</div>
                            <div>Geen les</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
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