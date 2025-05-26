import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Plus, Eye, Pencil, Trash2, Filter, Clock, Users, BookOpen, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PremiumHeader } from '@/components/ui/premium-header';
import { SearchActionBar } from '@/components/ui/search-action-bar';
import { DialogHeaderWithIcon } from '@/components/ui/dialog-header-with-icon';
import { DeleteDialog } from '@/components/ui/delete-dialog';

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

// Mock data voor Islamitische school
const mockScheduleData: ScheduleEntry[] = [
  {
    id: 1,
    dayOfWeek: 'Maandag',
    timeSlot: '08:30-09:20',
    startTime: '08:30',
    endTime: '09:20',
    className: '1A',
    classId: 1,
    subjectName: 'Arabisch',
    subjectId: 1,
    teacherName: 'Ahmed Al-Mansouri',
    teacherId: 1,
    roomName: 'Lokaal A1',
    roomId: 1,
    type: 'regular',
    status: 'active'
  },
  {
    id: 2,
    dayOfWeek: 'Maandag',
    timeSlot: '09:30-10:20',
    startTime: '09:30',
    endTime: '10:20',
    className: '1A',
    classId: 1,
    subjectName: 'Koran Studies',
    subjectId: 2,
    teacherName: 'Fatima Hassan',
    teacherId: 2,
    roomName: 'Lokaal A1',
    roomId: 1,
    type: 'regular',
    status: 'active'
  },
  {
    id: 3,
    dayOfWeek: 'Dinsdag',
    timeSlot: '08:30-09:20',
    startTime: '08:30',
    endTime: '09:20',
    className: '2A',
    classId: 2,
    subjectName: 'Islamitische Geschiedenis',
    subjectId: 3,
    teacherName: 'Omar Khalil',
    teacherId: 3,
    roomName: 'Lokaal B2',
    roomId: 2,
    type: 'regular',
    status: 'active'
  },
  {
    id: 4,
    dayOfWeek: 'Woensdag',
    timeSlot: '10:40-11:30',
    startTime: '10:40',
    endTime: '11:30',
    className: '1A',
    classId: 1,
    subjectName: 'Nederlandse Taal',
    subjectId: 4,
    teacherName: 'Maria van den Berg',
    teacherId: 4,
    roomName: 'Lokaal A1',
    roomId: 1,
    type: 'regular',
    status: 'active'
  },
  {
    id: 5,
    dayOfWeek: 'Donderdag',
    timeSlot: '09:30-10:20',
    startTime: '09:30',
    endTime: '10:20',
    className: '2A',
    classId: 2,
    subjectName: 'Fiqh',
    subjectId: 5,
    teacherName: 'Ahmed Al-Mansouri',
    teacherId: 1,
    roomName: 'Lokaal B2',
    roomId: 2,
    type: 'regular',
    status: 'active'
  },
  {
    id: 6,
    dayOfWeek: 'Vrijdag',
    timeSlot: '08:30-09:20',
    startTime: '08:30',
    endTime: '09:20',
    className: '1A',
    classId: 1,
    subjectName: 'Tafsir',
    subjectId: 6,
    teacherName: 'Omar Khalil',
    teacherId: 3,
    roomName: 'Lokaal A1',
    roomId: 1,
    type: 'regular',
    status: 'active'
  }
];

export default function SchedulingWeekly() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleEntry | null>(null);
  const [viewingSchedule, setViewingSchedule] = useState<ScheduleEntry | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<ScheduleEntry | null>(null);

  // New schedule form
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: '',
    timeSlot: '',
    className: '',
    subjectName: '',
    teacherName: '',
    roomName: '',
    notes: ''
  });

  // Use mock data for authentic Islamic school schedule
  const schedules = mockScheduleData;

  // Filtering
  const uniqueClasses = Array.from(new Set(schedules.map((s: ScheduleEntry) => s.className)));
  const uniqueTeachers = Array.from(new Set(schedules.map((s: ScheduleEntry) => s.teacherName)));
  const uniqueSubjects = Array.from(new Set(schedules.map((s: ScheduleEntry) => s.subjectName)));

  const filteredSchedules = schedules.filter((schedule: ScheduleEntry) => {
    const matchesSearch = searchTerm === '' || 
      schedule.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.className.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass === 'all' || schedule.className === selectedClass;
    const matchesTeacher = selectedTeacher === 'all' || schedule.teacherName === selectedTeacher;
    const matchesSubject = selectedSubject === 'all' || schedule.subjectName === selectedSubject;
    
    return matchesSearch && matchesClass && matchesTeacher && matchesSubject;
  });

  // Event handlers
  const handleViewSchedule = (schedule: ScheduleEntry) => {
    setViewingSchedule(schedule);
    setViewDialogOpen(true);
  };

  const handleEditSchedule = (schedule: ScheduleEntry) => {
    setEditingSchedule(schedule);
    setNewSchedule({
      dayOfWeek: schedule.dayOfWeek,
      timeSlot: schedule.timeSlot,
      className: schedule.className,
      subjectName: schedule.subjectName,
      teacherName: schedule.teacherName,
      roomName: schedule.roomName,
      notes: schedule.notes || ''
    });
    setAddDialogOpen(true);
  };

  const handleDeleteSchedule = (schedule: ScheduleEntry) => {
    setDeletingSchedule(schedule);
    setDeleteDialogOpen(true);
  };

  const handleAddSchedule = () => {
    // Mock implementation
    console.log('Adding/updating schedule:', newSchedule);
    setAddDialogOpen(false);
    setEditingSchedule(null);
    setNewSchedule({
      dayOfWeek: '',
      timeSlot: '',
      className: '',
      subjectName: '',
      teacherName: '',
      roomName: '',
      notes: ''
    });
  };

  const confirmDelete = () => {
    console.log('Deleting schedule:', deletingSchedule);
    setDeleteDialogOpen(false);
    setDeletingSchedule(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PremiumHeader 
        title="Lessenrooster" 
        icon={Calendar} 
        description="Bekijk het weekrooster voor alle klassen en docenten"
        breadcrumbs={{ parent: "Onderwijs", current: "Rooster" }}
      />

      <div className="p-6 space-y-6">
        {/* Search and Action Bar */}
        <SearchActionBar>
          <div className="flex-1">
            <Input
              placeholder="Zoek lessen, docenten, vakken..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Les Toevoegen
          </Button>
        </SearchActionBar>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Klas" />
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
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Docent" />
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
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Vak" />
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
                              className="bg-gradient-to-br from-blue-100 to-blue-50 hover:from-blue-200 hover:to-blue-100 p-3 rounded-lg text-xs cursor-pointer transition-all duration-200 group shadow-sm border border-blue-200"
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

        {/* Add/Edit Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeaderWithIcon 
              icon={editingSchedule ? Pencil : Plus} 
              title={editingSchedule ? "Les Bewerken" : "Nieuwe Les Toevoegen"} 
            />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dayOfWeek">Dag</Label>
                  <Select value={newSchedule.dayOfWeek} onValueChange={(value) => setNewSchedule(prev => ({ ...prev, dayOfWeek: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer dag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maandag">Maandag</SelectItem>
                      <SelectItem value="Dinsdag">Dinsdag</SelectItem>
                      <SelectItem value="Woensdag">Woensdag</SelectItem>
                      <SelectItem value="Donderdag">Donderdag</SelectItem>
                      <SelectItem value="Vrijdag">Vrijdag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timeSlot">Tijdslot</Label>
                  <Input
                    id="timeSlot"
                    value={newSchedule.timeSlot}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, timeSlot: e.target.value }))}
                    placeholder="08:30-09:20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="className">Klas</Label>
                  <Input
                    id="className"
                    value={newSchedule.className}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, className: e.target.value }))}
                    placeholder="1A"
                  />
                </div>
                <div>
                  <Label htmlFor="subjectName">Vak</Label>
                  <Input
                    id="subjectName"
                    value={newSchedule.subjectName}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, subjectName: e.target.value }))}
                    placeholder="Arabisch"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="teacherName">Docent</Label>
                  <Input
                    id="teacherName"
                    value={newSchedule.teacherName}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, teacherName: e.target.value }))}
                    placeholder="Ahmed Al-Mansouri"
                  />
                </div>
                <div>
                  <Label htmlFor="roomName">Lokaal</Label>
                  <Input
                    id="roomName"
                    value={newSchedule.roomName}
                    onChange={(e) => setNewSchedule(prev => ({ ...prev, roomName: e.target.value }))}
                    placeholder="Lokaal A1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Opmerkingen</Label>
                <Textarea
                  id="notes"
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optionele opmerkingen..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Annuleren
              </Button>
              <Button onClick={handleAddSchedule} className="bg-blue-600 hover:bg-blue-700">
                {editingSchedule ? "Bijwerken" : "Toevoegen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeaderWithIcon 
              icon={Eye} 
              title="Les Details" 
            />
            {viewingSchedule && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Dag</Label>
                    <p className="text-sm">{viewingSchedule.dayOfWeek}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Tijd</Label>
                    <p className="text-sm">{viewingSchedule.timeSlot}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Klas</Label>
                    <p className="text-sm">{viewingSchedule.className}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Vak</Label>
                    <p className="text-sm">{viewingSchedule.subjectName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Docent</Label>
                    <p className="text-sm">{viewingSchedule.teacherName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Lokaal</Label>
                    <p className="text-sm">{viewingSchedule.roomName}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge variant={viewingSchedule.status === 'active' ? 'default' : 'secondary'}>
                    {viewingSchedule.status === 'active' ? 'Actief' : 
                     viewingSchedule.status === 'cancelled' ? 'Geannuleerd' : 'Verplaatst'}
                  </Badge>
                </div>
                {viewingSchedule.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Opmerkingen</Label>
                    <p className="text-sm">{viewingSchedule.notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Sluiten
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={confirmDelete}
          title="Les Verwijderen"
          description="Weet je zeker dat je deze les wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
          itemName={deletingSchedule ? `${deletingSchedule.subjectName} - ${deletingSchedule.className}` : ""}
        />
      </div>
    </div>
  );
}