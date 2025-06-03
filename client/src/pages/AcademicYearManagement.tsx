import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Plus,
  Calendar,
  Clock,
  Settings,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload
} from 'lucide-react';
import { PremiumHeader } from '@/components/layout/premium-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  DataTableContainer, 
  SearchActionBar, 
  TableContainer,
  TableLoadingState,
  EmptyTableState,
  QuickActions
} from "@/components/ui/data-table-container";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

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
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isCreateYearDialogOpen, setIsCreateYearDialogOpen] = useState(false);
  const [isEditYearDialogOpen, setIsEditYearDialogOpen] = useState(false);
  const [isCreateHolidayDialogOpen, setIsCreateHolidayDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [yearToDelete, setYearToDelete] = useState<AcademicYear | null>(null);

  const [yearFormData, setYearFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    registrationStartDate: '',
    registrationEndDate: '',
    finalReportDate: '',
    description: ''
  });

  const [holidayFormData, setHolidayFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    type: 'vacation' as 'vacation' | 'public_holiday' | 'study_break',
    academicYearId: 0,
    description: ''
  });

  // Data queries
  const { data: academicYearsData = [], isLoading: yearsLoading } = useQuery({
    queryKey: ['/api/academic-years'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  const { data: holidaysData = [], isLoading: holidaysLoading } = useQuery({
    queryKey: ['/api/school-holidays'],
    select: (data: any) => Array.isArray(data) ? data : []
  });

  // Mutations
  const createYearMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/academic-years', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({ title: "Succes", description: "Schooljaar succesvol aangemaakt" });
      queryClient.invalidateQueries({ queryKey: ['/api/academic-years'] });
      setIsCreateYearDialogOpen(false);
      resetYearForm();
    },
    onError: () => {
      toast({ title: "Fout", description: "Er ging iets mis bij het aanmaken", variant: "destructive" });
    }
  });

  const updateYearMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/academic-years/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({ title: "Succes", description: "Schooljaar succesvol bijgewerkt" });
      queryClient.invalidateQueries({ queryKey: ['/api/academic-years'] });
      setIsEditYearDialogOpen(false);
      resetYearForm();
    },
    onError: () => {
      toast({ title: "Fout", description: "Er ging iets mis bij het bijwerken", variant: "destructive" });
    }
  });

  const deleteYearMutation = useMutation({
    mutationFn: async (id: number) => apiRequest(`/api/academic-years/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast({ title: "Succes", description: "Schooljaar succesvol verwijderd" });
      queryClient.invalidateQueries({ queryKey: ['/api/academic-years'] });
      setIsDeleteDialogOpen(false);
      setYearToDelete(null);
    },
    onError: () => {
      toast({ title: "Fout", description: "Er ging iets mis bij het verwijderen", variant: "destructive" });
    }
  });

  const createHolidayMutation = useMutation({
    mutationFn: async (data: any) => apiRequest('/api/school-holidays', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({ title: "Succes", description: "Vakantie succesvol toegevoegd" });
      queryClient.invalidateQueries({ queryKey: ['/api/school-holidays'] });
      setIsCreateHolidayDialogOpen(false);
      resetHolidayForm();
    },
    onError: () => {
      toast({ title: "Fout", description: "Er ging iets mis bij het toevoegen", variant: "destructive" });
    }
  });

  // Helper functions
  const resetYearForm = () => {
    setYearFormData({
      name: '',
      startDate: '',
      endDate: '',
      registrationStartDate: '',
      registrationEndDate: '',
      finalReportDate: '',
      description: ''
    });
    setSelectedYear(null);
  };

  const resetHolidayForm = () => {
    setHolidayFormData({
      name: '',
      startDate: '',
      endDate: '',
      type: 'vacation',
      academicYearId: 0,
      description: ''
    });
    setSelectedHoliday(null);
  };

  const handleEditYear = (year: AcademicYear) => {
    setSelectedYear(year);
    setYearFormData({
      name: year.name,
      startDate: year.startDate,
      endDate: year.endDate,
      registrationStartDate: year.registrationStartDate,
      registrationEndDate: year.registrationEndDate,
      finalReportDate: year.finalReportDate,
      description: year.description || ''
    });
    setIsEditYearDialogOpen(true);
  };

  const handleDeleteYear = (year: AcademicYear) => {
    setYearToDelete(year);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteYear = () => {
    if (yearToDelete) {
      deleteYearMutation.mutate(yearToDelete.id);
    }
  };

  const handleCreateYear = () => {
    createYearMutation.mutate(yearFormData);
  };

  const handleUpdateYear = () => {
    if (selectedYear) {
      updateYearMutation.mutate({ id: selectedYear.id, data: yearFormData });
    }
  };

  const handleCreateHoliday = () => {
    createHolidayMutation.mutate(holidayFormData);
  };

  const getStatusBadge = (year: AcademicYear) => {
    if (year.isActive) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Actief</Badge>;
    } else {
      return <Badge variant="secondary">Inactief</Badge>;
    }
  };

  const getHolidayTypeBadge = (type: string) => {
    const typeMap = {
      vacation: { label: 'Vakantie', color: 'bg-blue-100 text-blue-800' },
      public_holiday: { label: 'Feestdag', color: 'bg-purple-100 text-purple-800' },
      study_break: { label: 'Studieonderbreking', color: 'bg-orange-100 text-orange-800' }
    };
    const config = typeMap[type as keyof typeof typeMap] || typeMap.vacation;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Filter functions
  const filteredYears = academicYearsData.filter((year: AcademicYear) => {
    return year.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredHolidays = holidaysData.filter((holiday: Holiday) => {
    return holiday.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Schooljaar Beheer</h1>
              <p className="text-gray-600">Beheer schooljaren en academische periodes</p>
            </div>
            <Button
              onClick={() => setIsCreateYearDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nieuw Schooljaar
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Totaal Schooljaren</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredYears.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Settings className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Actieve Schooljaren</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {academicYearsData.filter((y: any) => y.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Schoolvakanties</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredHolidays.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Komende Vakanties</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {holidaysData.filter((h: any) => new Date(h.startDate) > new Date()).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Schooljaren Overzicht</CardTitle>
                <CardDescription>Beheer en organiseer alle schooljaren</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Zoek schooljaren..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Button
                  onClick={() => setIsCreateHolidayDialogOpen(true)}
                  variant="outline"
                  className="ml-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Vakantie Toevoegen
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {yearsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Schooljaren laden...</p>
              </div>
            ) : filteredYears.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen schooljaren</h3>
                <p className="text-gray-500 mb-4">Begin met het toevoegen van je eerste schooljaar.</p>
                <Button onClick={() => setIsCreateYearDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schooljaar Toevoegen
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredYears.map((year: AcademicYear) => (
                  <div key={year.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{year.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(year.startDate).toLocaleDateString('nl-NL')} - {new Date(year.endDate).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(year)}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditYear(year)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteYear(year)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Holidays Section */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Schoolvakanties</CardTitle>
                <CardDescription>Beheer vakanties en vrije dagen</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {holidaysLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Vakanties laden...</p>
              </div>
            ) : filteredHolidays.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Geen vakanties</h3>
                <p className="text-gray-500 mb-4">Begin met het toevoegen van schoolvakanties.</p>
                <Button onClick={() => setIsCreateHolidayDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Vakantie Toevoegen
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHolidays.map((holiday: Holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{holiday.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(holiday.startDate).toLocaleDateString('nl-NL')} - {new Date(holiday.endDate).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {holiday.type}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditHoliday(holiday)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteHoliday(holiday)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nieuw Schooljaar</DialogTitle>
            <DialogDescription>
              Voeg een nieuw schooljaar toe met alle belangrijke datums.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Schooljaar Naam</Label>
                <Input
                  id="name"
                  value={yearFormData.name}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="bijv. 2024-2025"
                />
              </div>
              <div>
                <Label htmlFor="description">Beschrijving (optioneel)</Label>
                <Input
                  id="description"
                  value={yearFormData.description}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Korte beschrijving"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Datum</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={yearFormData.startDate}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Eind Datum</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={yearFormData.endDate}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="registrationStartDate">Inschrijving Start</Label>
                <Input
                  id="registrationStartDate"
                  type="date"
                  value={yearFormData.registrationStartDate}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, registrationStartDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="registrationEndDate">Inschrijving Eind</Label>
                <Input
                  id="registrationEndDate"
                  type="date"
                  value={yearFormData.registrationEndDate}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, registrationEndDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="finalReportDate">Eindrapport Datum</Label>
              <Input
                id="finalReportDate"
                type="date"
                value={yearFormData.finalReportDate}
                onChange={(e) => setYearFormData(prev => ({ ...prev, finalReportDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateYearDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={handleCreateYear}
              disabled={!yearFormData.name || !yearFormData.startDate || !yearFormData.endDate}
            >
              Schooljaar Aanmaken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Academic Year Dialog */}
      <Dialog open={isEditYearDialogOpen} onOpenChange={setIsEditYearDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schooljaar Bewerken</DialogTitle>
            <DialogDescription>
              Wijzig de gegevens van het schooljaar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Schooljaar Naam</Label>
                <Input
                  id="edit-name"
                  value={yearFormData.name}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Beschrijving</Label>
                <Input
                  id="edit-description"
                  value={yearFormData.description}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">Start Datum</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={yearFormData.startDate}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-endDate">Eind Datum</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={yearFormData.endDate}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-registrationStartDate">Inschrijving Start</Label>
                <Input
                  id="edit-registrationStartDate"
                  type="date"
                  value={yearFormData.registrationStartDate}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, registrationStartDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-registrationEndDate">Inschrijving Eind</Label>
                <Input
                  id="edit-registrationEndDate"
                  type="date"
                  value={yearFormData.registrationEndDate}
                  onChange={(e) => setYearFormData(prev => ({ ...prev, registrationEndDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-finalReportDate">Eindrapport Datum</Label>
              <Input
                id="edit-finalReportDate"
                type="date"
                value={yearFormData.finalReportDate}
                onChange={(e) => setYearFormData(prev => ({ ...prev, finalReportDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditYearDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleUpdateYear}>
              Wijzigingen Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Holiday Dialog */}
      <Dialog open={isCreateHolidayDialogOpen} onOpenChange={setIsCreateHolidayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nieuwe Vakantie</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe schoolvakantie of vrije dag toe.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="holiday-name">Naam</Label>
              <Input
                id="holiday-name"
                value={holidayFormData.name}
                onChange={(e) => setHolidayFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="bijv. Kerstvakantie"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="holiday-type">Type</Label>
                <Select 
                  value={holidayFormData.type} 
                  onValueChange={(value: any) => setHolidayFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Vakantie</SelectItem>
                    <SelectItem value="public_holiday">Feestdag</SelectItem>
                    <SelectItem value="study_break">Studieonderbreking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="holiday-year">Schooljaar</Label>
                <Select 
                  value={holidayFormData.academicYearId.toString()} 
                  onValueChange={(value) => setHolidayFormData(prev => ({ ...prev, academicYearId: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer schooljaar" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYearsData.map((year: AcademicYear) => (
                      <SelectItem key={year.id} value={year.id.toString()}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="holiday-startDate">Start Datum</Label>
                <Input
                  id="holiday-startDate"
                  type="date"
                  value={holidayFormData.startDate}
                  onChange={(e) => setHolidayFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="holiday-endDate">Eind Datum</Label>
                <Input
                  id="holiday-endDate"
                  type="date"
                  value={holidayFormData.endDate}
                  onChange={(e) => setHolidayFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="holiday-description">Beschrijving (optioneel)</Label>
              <Textarea
                id="holiday-description"
                value={holidayFormData.description}
                onChange={(e) => setHolidayFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Extra informatie over de vakantie"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateHolidayDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={handleCreateHoliday}
              disabled={!holidayFormData.name || !holidayFormData.startDate || !holidayFormData.endDate || !holidayFormData.academicYearId}
            >
              Vakantie Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDeleteYear}
        title="Schooljaar Verwijderen"
        description={`Weet je zeker dat je het schooljaar "${yearToDelete?.name}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`}
        itemName={yearToDelete?.name || ''}
      />
    </div>
  );
}