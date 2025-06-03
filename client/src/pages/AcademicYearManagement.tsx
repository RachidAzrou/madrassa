import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Plus,
  Calendar,
  Edit,
  Trash2,
  Clock,
  X
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  registrationStartDate: string;
  registrationEndDate: string;
  finalReportDate: string;
  description?: string;
}

interface Holiday {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  academicYearId: number;
  type: 'vacation' | 'public_holiday' | 'study_break';
  description?: string;
}

export default function AcademicYearManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [deleteYearDialogOpen, setDeleteYearDialogOpen] = useState(false);
  const [deleteHolidayDialogOpen, setDeleteHolidayDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [yearToDelete, setYearToDelete] = useState<AcademicYear | null>(null);
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for academic year
  const [yearForm, setYearForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: false,
    registrationStartDate: '',
    registrationEndDate: '',
    finalReportDate: '',
    description: ''
  });

  // Form state for holiday
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    type: 'vacation' as 'vacation' | 'public_holiday' | 'study_break',
    academicYearId: '',
    description: ''
  });

  // Data fetching
  const { data: academicYearsData = [], isLoading: yearsLoading } = useQuery({
    queryKey: ['/api/academic-years']
  });

  const { data: holidaysData = [], isLoading: holidaysLoading } = useQuery({
    queryKey: ['/api/holidays']
  });

  // Mutations
  const createYearMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/academic-years', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic-years'] });
      setYearDialogOpen(false);
      resetYearForm();
      toast({
        title: "Succes",
        description: "Schooljaar succesvol toegevoegd",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er ging iets mis bij het toevoegen van het schooljaar",
        variant: "destructive",
      });
    }
  });

  const updateYearMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/academic-years/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic-years'] });
      setYearDialogOpen(false);
      setEditingYear(null);
      resetYearForm();
      toast({
        title: "Succes",
        description: "Schooljaar succesvol bijgewerkt",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er ging iets mis bij het bijwerken van het schooljaar",
        variant: "destructive",
      });
    }
  });

  const deleteYearMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/academic-years/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic-years'] });
      toast({
        title: "Succes",
        description: "Schooljaar succesvol verwijderd",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er ging iets mis bij het verwijderen van het schooljaar",
        variant: "destructive",
      });
    }
  });

  const createHolidayMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/holidays', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/holidays'] });
      setHolidayDialogOpen(false);
      resetHolidayForm();
      toast({
        title: "Succes",
        description: "Vakantie succesvol toegevoegd",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er ging iets mis bij het toevoegen van de vakantie",
        variant: "destructive",
      });
    }
  });

  const updateHolidayMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/holidays/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/holidays'] });
      setHolidayDialogOpen(false);
      setEditingHoliday(null);
      resetHolidayForm();
      toast({
        title: "Succes",
        description: "Vakantie succesvol bijgewerkt",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er ging iets mis bij het bijwerken van de vakantie",
        variant: "destructive",
      });
    }
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/holidays/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/holidays'] });
      toast({
        title: "Succes",
        description: "Vakantie succesvol verwijderd",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout",
        description: error.message || "Er ging iets mis bij het verwijderen van de vakantie",
        variant: "destructive",
      });
    }
  });

  // Helper functions
  const resetYearForm = () => {
    setYearForm({
      name: '',
      startDate: '',
      endDate: '',
      isActive: false,
      registrationStartDate: '',
      registrationEndDate: '',
      finalReportDate: '',
      description: ''
    });
  };

  const resetHolidayForm = () => {
    setHolidayForm({
      name: '',
      startDate: '',
      endDate: '',
      type: 'vacation',
      academicYearId: '',
      description: ''
    });
  };

  // Event handlers
  const handleEditYear = (year: AcademicYear) => {
    setEditingYear(year);
    setYearForm({
      name: year.name,
      startDate: year.startDate,
      endDate: year.endDate,
      isActive: year.isActive,
      registrationStartDate: year.registrationStartDate,
      registrationEndDate: year.registrationEndDate,
      finalReportDate: year.finalReportDate,
      description: year.description || ''
    });
    setYearDialogOpen(true);
  };

  const handleDeleteYear = (year: AcademicYear) => {
    setYearToDelete(year);
    setDeleteYearDialogOpen(true);
  };

  const confirmDeleteYear = () => {
    if (yearToDelete) {
      deleteYearMutation.mutate(yearToDelete.id);
      setDeleteYearDialogOpen(false);
      setYearToDelete(null);
    }
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setHolidayForm({
      name: holiday.name,
      startDate: holiday.startDate,
      endDate: holiday.endDate,
      type: holiday.type,
      academicYearId: holiday.academicYearId.toString(),
      description: holiday.description || ''
    });
    setHolidayDialogOpen(true);
  };

  const handleDeleteHoliday = (holiday: Holiday) => {
    setHolidayToDelete(holiday);
    setDeleteHolidayDialogOpen(true);
  };

  const confirmDeleteHoliday = () => {
    if (holidayToDelete) {
      deleteHolidayMutation.mutate(holidayToDelete.id);
      setDeleteHolidayDialogOpen(false);
      setHolidayToDelete(null);
    }
  };

  const handleYearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingYear) {
      updateYearMutation.mutate({ id: editingYear.id, data: yearForm });
    } else {
      createYearMutation.mutate(yearForm);
    }
  };

  const handleHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...holidayForm,
      academicYearId: parseInt(holidayForm.academicYearId)
    };
    
    if (editingHoliday) {
      updateHolidayMutation.mutate({ id: editingHoliday.id, data: submitData });
    } else {
      createHolidayMutation.mutate(submitData);
    }
  };

  const openNewYearDialog = () => {
    setEditingYear(null);
    resetYearForm();
    setYearDialogOpen(true);
  };

  const openNewHolidayDialog = () => {
    setEditingHoliday(null);
    resetHolidayForm();
    setHolidayDialogOpen(true);
  };

  const getStatusBadge = (year: AcademicYear) => {
    if (year.isActive) {
      return <Badge className="bg-green-100 text-green-800 text-xs">Actief</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-600 text-xs">Inactief</Badge>;
  };

  const getHolidayTypeLabel = (type: string) => {
    switch (type) {
      case 'vacation':
        return 'Vakantie';
      case 'public_holiday':
        return 'Feestdag';
      case 'study_break':
        return 'Studiepauze';
      default:
        return type;
    }
  };

  const getHolidayTypeBadge = (type: string) => {
    const label = getHolidayTypeLabel(type);
    switch (type) {
      case 'vacation':
        return (
          <div className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-sm font-medium">
            {label}
          </div>
        );
      case 'public_holiday':
        return (
          <div className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-sm font-medium">
            {label}
          </div>
        );
      case 'study_break':
        return (
          <div className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] rounded-sm font-medium">
            {label}
          </div>
        );
      default:
        return (
          <div className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] rounded-sm font-medium">
            {label}
          </div>
        );
    }
  };

  // Filter data based on search
  const filteredYears = (academicYearsData as any[]).filter((year: AcademicYear) =>
    year.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHolidays = (holidaysData as any[]).filter((holiday: Holiday) =>
    holiday.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      <PageHeader 
        title="Schooljaar Beheer"
        icon={<Calendar className="h-4 w-4 text-white" />}
        current="Schooljaar Beheer"
      />

      {/* Main content area */}
      <div className="px-6 py-6 max-w-7xl mx-auto w-full">

        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
            <Input
              placeholder="Zoek schooljaren..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs border-[#e5e7eb] rounded-sm"
            />
          </div>
          <Button 
            onClick={openNewYearDialog}
            className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white h-8 text-xs px-3 rounded-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Schooljaar Toevoegen
          </Button>
        </div>

        {/* Academic Years Section */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm mb-4">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#e5e7eb] bg-[#f9fafc]">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-[#1e40af]" />
              <h3 className="text-xs font-medium text-gray-700 tracking-tight">Schooljaren</h3>
            </div>
            <span className="text-xs text-gray-500">{filteredYears.length} schooljaren</span>
          </div>

          <div className="p-4">
            {yearsLoading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredYears.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center">
                <div className="p-2 bg-[#f7f9fc] text-[#1e40af] mb-3 border border-[#e5e7eb] rounded-sm">
                  <Calendar className="h-5 w-5 opacity-60" />
                </div>
                <p className="text-xs text-gray-500 mb-2">Geen schooljaren beschikbaar</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] h-6 border-[#e5e7eb] text-gray-600 hover:bg-gray-50 rounded-sm"
                >
                  Maak een schooljaar aan
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredYears.map((year: AcademicYear) => (
                  <div key={year.id} className="flex items-center justify-between p-3 border border-[#e5e7eb] rounded-sm hover:bg-[#f8f9fa] transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-800">{year.name}</h4>
                        {getStatusBadge(year)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(year.startDate).toLocaleDateString('nl-NL')} - {new Date(year.endDate).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => handleEditYear(year)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteYear(year)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Holidays Section */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#e5e7eb] bg-[#f9fafc]">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-[#1e40af]" />
              <h3 className="text-xs font-medium text-gray-700 tracking-tight">Schoolvakanties</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{filteredHolidays.length} vakanties</span>
              <Button 
                onClick={openNewHolidayDialog}
                size="sm" 
                className="bg-[#1e40af] hover:bg-[#1d4ed8] text-white h-6 text-[10px] px-2 rounded-sm"
              >
                <Plus className="h-3 w-3 mr-1" />
                Vakantie Toevoegen
              </Button>
            </div>
          </div>

          <div className="p-4">
            {holidaysLoading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredHolidays.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center">
                <div className="p-2 bg-[#f7f9fc] text-[#1e40af] mb-3 border border-[#e5e7eb] rounded-sm">
                  <Clock className="h-5 w-5 opacity-60" />
                </div>
                <p className="text-xs text-gray-500 mb-2">Geen vakanties beschikbaar</p>
                <Button 
                  onClick={openNewHolidayDialog}
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] h-6 border-[#e5e7eb] text-gray-600 hover:bg-gray-50 rounded-sm"
                >
                  Vakantie toevoegen
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHolidays.map((holiday: Holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between p-3 border border-[#e5e7eb] rounded-sm hover:bg-[#f8f9fa] transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-800">{holiday.name}</h4>
                        {getHolidayTypeBadge(holiday.type)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(holiday.startDate).toLocaleDateString('nl-NL')} - {new Date(holiday.endDate).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        onClick={() => handleEditHoliday(holiday)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteHoliday(holiday)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Academic Year Dialog */}
      <Dialog open={yearDialogOpen} onOpenChange={setYearDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingYear ? 'Schooljaar Bewerken' : 'Nieuw Schooljaar'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleYearSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Naam</Label>
              <Input
                id="name"
                value={yearForm.name}
                onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Startdatum</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={yearForm.startDate}
                  onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">Einddatum</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={yearForm.endDate}
                  onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="regStart">Registratie Start</Label>
                <Input
                  id="regStart"
                  type="date"
                  value={yearForm.registrationStartDate}
                  onChange={(e) => setYearForm({ ...yearForm, registrationStartDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="regEnd">Registratie Eind</Label>
                <Input
                  id="regEnd"
                  type="date"
                  value={yearForm.registrationEndDate}
                  onChange={(e) => setYearForm({ ...yearForm, registrationEndDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="finalReport">Eindrapport Datum</Label>
              <Input
                id="finalReport"
                type="date"
                value={yearForm.finalReportDate}
                onChange={(e) => setYearForm({ ...yearForm, finalReportDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                value={yearForm.description}
                onChange={(e) => setYearForm({ ...yearForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={yearForm.isActive}
                onChange={(e) => setYearForm({ ...yearForm, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isActive">Actief schooljaar</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setYearDialogOpen(false);
                  setEditingYear(null);
                  resetYearForm();
                }}
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                disabled={createYearMutation.isPending || updateYearMutation.isPending}
                className="flex-1 bg-[#1e40af] hover:bg-[#1d4ed8]"
              >
                {createYearMutation.isPending || updateYearMutation.isPending ? 'Bezig...' : editingYear ? 'Bijwerken' : 'Toevoegen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Holiday Dialog */}
      <Dialog open={holidayDialogOpen} onOpenChange={setHolidayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingHoliday ? 'Vakantie Bewerken' : 'Nieuwe Vakantie'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleHolidaySubmit} className="space-y-4">
            <div>
              <Label htmlFor="holidayName">Naam</Label>
              <Input
                id="holidayName"
                value={holidayForm.name}
                onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="holidayStartDate">Startdatum</Label>
                <Input
                  id="holidayStartDate"
                  type="date"
                  value={holidayForm.startDate}
                  onChange={(e) => setHolidayForm({ ...holidayForm, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="holidayEndDate">Einddatum</Label>
                <Input
                  id="holidayEndDate"
                  type="date"
                  value={holidayForm.endDate}
                  onChange={(e) => setHolidayForm({ ...holidayForm, endDate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="holidayType">Type</Label>
              <Select
                value={holidayForm.type}
                onValueChange={(value: 'vacation' | 'public_holiday' | 'study_break') => 
                  setHolidayForm({ ...holidayForm, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vakantie</SelectItem>
                  <SelectItem value="public_holiday">Feestdag</SelectItem>
                  <SelectItem value="study_break">Studiepauze</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="academicYear">Schooljaar</Label>
              <Select
                value={holidayForm.academicYearId}
                onValueChange={(value) => setHolidayForm({ ...holidayForm, academicYearId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer schooljaar" />
                </SelectTrigger>
                <SelectContent>
                  {(academicYearsData as AcademicYear[]).map((year) => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="holidayDescription">Beschrijving</Label>
              <Textarea
                id="holidayDescription"
                value={holidayForm.description}
                onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setHolidayDialogOpen(false);
                  setEditingHoliday(null);
                  resetHolidayForm();
                }}
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                disabled={createHolidayMutation.isPending || updateHolidayMutation.isPending}
                className="flex-1 bg-[#1e40af] hover:bg-[#1d4ed8]"
              >
                {createHolidayMutation.isPending || updateHolidayMutation.isPending ? 'Bezig...' : editingHoliday ? 'Bijwerken' : 'Toevoegen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Academic Year Confirmation Dialog */}
      <Dialog open={deleteYearDialogOpen} onOpenChange={setDeleteYearDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Schooljaar Verwijderen
            </DialogTitle>
            <DialogDescription>
              Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800 mb-1">
                    Weet je zeker dat je dit schooljaar wilt verwijderen?
                  </h4>
                  <p className="text-sm text-red-700">
                    <strong>{yearToDelete?.name}</strong> wordt permanent verwijderd van het systeem.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Alle gerelateerde gegevens zoals vakanties en inschrijvingen worden ook verwijderd.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteYearDialogOpen(false);
                setYearToDelete(null);
              }}
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteYear}
              disabled={deleteYearMutation.isPending}
              className="flex-1"
            >
              {deleteYearMutation.isPending ? 'Verwijderen...' : 'Definitief Verwijderen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Holiday Confirmation Dialog */}
      <Dialog open={deleteHolidayDialogOpen} onOpenChange={setDeleteHolidayDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Vakantie Verwijderen
            </DialogTitle>
            <DialogDescription>
              Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800 mb-1">
                    Weet je zeker dat je deze vakantie wilt verwijderen?
                  </h4>
                  <p className="text-sm text-red-700">
                    <strong>{holidayToDelete?.name}</strong> wordt permanent verwijderd van het systeem.
                  </p>
                  {holidayToDelete && (
                    <p className="text-xs text-red-600 mt-1">
                      {new Date(holidayToDelete.startDate).toLocaleDateString('nl-NL')} - {new Date(holidayToDelete.endDate).toLocaleDateString('nl-NL')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteHolidayDialogOpen(false);
                setHolidayToDelete(null);
              }}
              className="flex-1"
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteHoliday}
              disabled={deleteHolidayMutation.isPending}
              className="flex-1"
            >
              {deleteHolidayMutation.isPending ? 'Verwijderen...' : 'Definitief Verwijderen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}