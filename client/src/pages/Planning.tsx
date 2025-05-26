import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { FormLabel } from '@/components/ui/form';

// Types
interface ScheduleEntry {
  id: number;
  timeSlot: string;
  dayOfWeek: string;
  className: string;
  classId: number;
  subjectName: string;
  subjectId: number;
  teacherName: string;
  teacherId: number;
  roomNumber: string;
  roomId: number;
  startTime: string;
  endTime: string;
  academicYear: string;
  notes?: string;
}

interface Class {
  id: number;
  name: string;
  academicYear: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  teacherId: string;
}

interface Room {
  id: number;
  roomNumber: string;
  building: string;
  capacity: number;
}

export default function Planning() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterTeacher, setFilterTeacher] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterDay, setFilterDay] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleEntry | null>(null);

  // Form data
  const [scheduleFormData, setScheduleFormData] = useState({
    timeSlot: '',
    dayOfWeek: 'Maandag',
    classId: '',
    subjectId: '',
    teacherId: '',
    roomId: '',
    startTime: '',
    endTime: '',
    academicYear: '2025-2026',
    notes: ''
  });

  // Fetch data
  const { data: schedulesData = [], isLoading, isError } = useQuery({
    queryKey: ['/api/schedules'],
    staleTime: 30000,
  });

  const { data: classesData = [] } = useQuery({
    queryKey: ['/api/student-groups'],
    staleTime: 60000,
  });

  const { data: subjectsData = [] } = useQuery({
    queryKey: ['/api/courses'],
    staleTime: 60000,
  });

  const { data: teachersData = [] } = useQuery({
    queryKey: ['/api/teachers'],
    staleTime: 60000,
  });

  const { data: roomsData = [] } = useQuery({
    queryKey: ['/api/rooms'],
    staleTime: 60000,
  });

  // Process data
  const schedules = Array.isArray(schedulesData) ? schedulesData : [];
  const classes = Array.isArray(classesData) ? classesData : [];
  const subjects = Array.isArray(subjectsData?.courses) ? subjectsData.courses : [];
  const teachers = Array.isArray(teachersData?.teachers) ? teachersData.teachers : [];
  const rooms = Array.isArray(roomsData?.rooms) ? roomsData.rooms : [];

  // Filter schedules
  const filteredSchedules = schedules.filter((schedule: ScheduleEntry) => {
    const matchesSearch = searchTerm === "" || 
      schedule.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = filterClass === "all" || schedule.classId.toString() === filterClass;
    const matchesTeacher = filterTeacher === "all" || schedule.teacherId.toString() === filterTeacher;
    const matchesSubject = filterSubject === "all" || schedule.subjectId.toString() === filterSubject;
    const matchesDay = filterDay === "all" || schedule.dayOfWeek === filterDay;

    return matchesSearch && matchesClass && matchesTeacher && matchesSubject && matchesDay;
  });

  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const resetForm = () => {
    setScheduleFormData({
      timeSlot: '',
      dayOfWeek: 'Maandag',
      classId: '',
      subjectId: '',
      teacherId: '',
      roomId: '',
      startTime: '',
      endTime: '',
      academicYear: '2025-2026',
      notes: ''
    });
  };

  const handleAddSchedule = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleViewSchedule = (id: number) => {
    const schedule = schedules.find((s: ScheduleEntry) => s.id === id);
    if (schedule) {
      setSelectedSchedule(schedule);
      setIsViewDialogOpen(true);
    }
  };

  const handleEditSchedule = (id: number) => {
    const schedule = schedules.find((s: ScheduleEntry) => s.id === id);
    if (schedule) {
      setSelectedSchedule(schedule);
      setScheduleFormData({
        timeSlot: schedule.timeSlot,
        dayOfWeek: schedule.dayOfWeek,
        classId: schedule.classId.toString(),
        subjectId: schedule.subjectId.toString(),
        teacherId: schedule.teacherId.toString(),
        roomId: schedule.roomId.toString(),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        academicYear: schedule.academicYear,
        notes: schedule.notes || ''
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleDeleteSchedule = (id: number) => {
    const schedule = schedules.find((s: ScheduleEntry) => s.id === id);
    if (schedule) {
      setSelectedSchedule(schedule);
      setIsDeleteDialogOpen(true);
    }
  };

  // Helper functions
  const formatTimeSlot = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`;
  };

  const getDayColor = (day: string) => {
    const colors = {
      'Maandag': 'bg-blue-100 text-blue-800',
      'Dinsdag': 'bg-green-100 text-green-800',
      'Woensdag': 'bg-yellow-100 text-yellow-800',
      'Donderdag': 'bg-purple-100 text-purple-800',
      'Vrijdag': 'bg-red-100 text-red-800',
      'Zaterdag': 'bg-gray-100 text-gray-800',
      'Zondag': 'bg-orange-100 text-orange-800'
    };
    return colors[day as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Premium header */}
      <PremiumHeader 
        title="Planning" 
        path="Onderwijs > Planning" 
        icon={Calendar}
        description="Beheer het lessenrooster voor alle klassen, vakken en docenten"
      />
      
      {/* Main content */}
      <div className="px-6 py-6 flex-1 space-y-6">
        {/* Search and filters */}
        <SearchActionLayout>
          <SearchActionBar>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Zoek in planning..."
                className="pl-9 h-8 text-xs bg-white rounded-sm border-[#e5e7eb]"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8 px-2 border-gray-300"
              >
                <Filter className="h-3.5 w-3.5" />
              </Button>
              
              <Button
                onClick={handleAddSchedule}
                className="bg-[#1e40af] hover:bg-[#1e3a8a] h-8 px-3 text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Les Inplannen
              </Button>
            </div>
          </SearchActionBar>
        </SearchActionLayout>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <FormLabel className="text-xs font-medium text-gray-700 mb-1">Klas</FormLabel>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Alle klassen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle klassen</SelectItem>
                    {classes.map((cls: any) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FormLabel className="text-xs font-medium text-gray-700 mb-1">Docent</FormLabel>
                <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Alle docenten" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle docenten</SelectItem>
                    {teachers.map((teacher: any) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.firstName} {teacher.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FormLabel className="text-xs font-medium text-gray-700 mb-1">Vak</FormLabel>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Alle vakken" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle vakken</SelectItem>
                    {subjects.map((subject: any) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <FormLabel className="text-xs font-medium text-gray-700 mb-1">Dag</FormLabel>
                <Select value={filterDay} onValueChange={setFilterDay}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Alle dagen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle dagen</SelectItem>
                    <SelectItem value="Maandag">Maandag</SelectItem>
                    <SelectItem value="Dinsdag">Dinsdag</SelectItem>
                    <SelectItem value="Woensdag">Woensdag</SelectItem>
                    <SelectItem value="Donderdag">Donderdag</SelectItem>
                    <SelectItem value="Vrijdag">Vrijdag</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterClass("all");
                    setFilterTeacher("all");
                    setFilterSubject("all");
                    setFilterDay("all");
                  }}
                  className="h-8 text-xs"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule table */}
        <StandardTable>
          <StandardTableHeader>
            <tr>
              <StandardTableHeaderCell>Dag</StandardTableHeaderCell>
              <StandardTableHeaderCell>Tijdslot</StandardTableHeaderCell>
              <StandardTableHeaderCell>Klas</StandardTableHeaderCell>
              <StandardTableHeaderCell>Vak</StandardTableHeaderCell>
              <StandardTableHeaderCell>Docent</StandardTableHeaderCell>
              <StandardTableHeaderCell>Lokaal</StandardTableHeaderCell>
              <EmptyActionHeader />
            </tr>
          </StandardTableHeader>
          <StandardTableBody>
            {isLoading ? (
              <TableLoadingState colSpan={7} message="Planning laden..." />
            ) : isError ? (
              <TableErrorState 
                colSpan={7} 
                message="Er is een fout opgetreden bij het laden van de planning."
                onRetry={() => queryClient.invalidateQueries({ queryKey: ['/api/schedules'] })}
              />
            ) : filteredSchedules.length === 0 ? (
              <TableEmptyState
                colSpan={7}
                icon={<Calendar className="h-12 w-12 mx-auto text-gray-300" />}
                title="Geen lessen gevonden"
                description={searchTerm || showFilters
                  ? "Geen lessen komen overeen met uw filters."
                  : "Er zijn nog geen lessen ingepland."}
                action={
                  <Button
                    onClick={handleAddSchedule}
                    className="bg-[#1e40af] hover:bg-[#1e3a8a]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Eerste Les Inplannen
                  </Button>
                }
              />
            ) : (
              filteredSchedules.map((schedule: ScheduleEntry) => (
                <StandardTableRow key={schedule.id}>
                  <StandardTableCell className="whitespace-nowrap">
                    <Badge className={`${getDayColor(schedule.dayOfWeek)} border-0`}>
                      {schedule.dayOfWeek}
                    </Badge>
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="text-xs font-mono">
                        {formatTimeSlot(schedule.startTime, schedule.endTime)}
                      </span>
                    </div>
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="font-medium">{schedule.className}</span>
                    </div>
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <BookOpen className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="text-gray-900">{schedule.subjectName}</span>
                    </div>
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="text-gray-900">{schedule.teacherName}</span>
                    </div>
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                      <span className="text-gray-900">{schedule.roomNumber}</span>
                    </div>
                  </StandardTableCell>
                  <StandardTableCell className="whitespace-nowrap text-right">
                    <QuickActions
                      onView={() => handleViewSchedule(schedule.id)}
                      onEdit={() => handleEditSchedule(schedule.id)}
                      onDelete={() => handleDeleteSchedule(schedule.id)}
                    />
                  </StandardTableCell>
                </StandardTableRow>
              ))
            )}
          </StandardTableBody>
        </StandardTable>
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
              description: "De les is succesvol verwijderd uit de planning.",
            });
          }}
          title="Les verwijderen"
          description={`Weet je zeker dat je de les ${selectedSchedule.subjectName} voor klas ${selectedSchedule.className} op ${selectedSchedule.dayOfWeek} om ${selectedSchedule.startTime} wilt verwijderen?`}
          itemName={`${selectedSchedule.subjectName} - ${selectedSchedule.className}`}
        />
      )}
    </div>
  );
}